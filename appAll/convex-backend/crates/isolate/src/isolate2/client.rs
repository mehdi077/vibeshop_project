use std::{
    sync::Arc,
    time::{
        Duration,
        Instant,
    },
};

use common::{
    runtime::Runtime,
    types::UdfType,
};
use deno_core::ModuleSpecifier;
use serde_json::Value as JsonValue;
use sync_types::CanonicalizedUdfPath;
use tokio::sync::{
    mpsc::{
        self,
        error::TrySendError,
    },
    oneshot,
    Semaphore,
};
use value::{
    ConvexArray,
    ConvexValue,
};

use super::{
    environment::EnvironmentOutcome,
    FunctionId,
    PromiseId,
};
use crate::{
    environment::{
        action::TaskResponseEnum,
        AsyncOpRequest,
    },
    timeout::FunctionExecutionTime,
};

pub enum IsolateThreadRequest {
    RegisterModule {
        name: ModuleSpecifier,
        source: String,
        source_map: Option<String>,
        response: oneshot::Sender<anyhow::Result<Vec<ModuleSpecifier>>>,
    },
    EvaluateModule {
        name: ModuleSpecifier,
        response: oneshot::Sender<anyhow::Result<()>>,
    },
    StartFunction {
        udf_type: UdfType,
        udf_path: CanonicalizedUdfPath,
        arguments: ConvexArray,
        response: oneshot::Sender<anyhow::Result<(FunctionId, EvaluateResult)>>,
    },
    PollFunction {
        function_id: FunctionId,
        completions: Completions,
        response: oneshot::Sender<anyhow::Result<EvaluateResult>>,
    },
    Shutdown {
        response: oneshot::Sender<anyhow::Result<EnvironmentOutcome>>,
    },
}

pub enum EvaluateResult {
    Ready(ConvexValue),
    Pending(Pending),
}

#[derive(Debug)]
pub struct Pending {
    pub async_syscalls: Vec<PendingAsyncSyscall>,
    pub async_ops: Vec<PendingAsyncOp>,
    pub dynamic_imports: Vec<PendingDynamicImport>,
}

impl Pending {
    pub fn is_empty(&self) -> bool {
        self.async_syscalls.is_empty()
            && self.async_ops.is_empty()
            && self.dynamic_imports.is_empty()
    }
}

#[derive(Debug)]
pub struct Completions {
    pub async_syscalls: Vec<AsyncSyscallCompletion>,
    pub async_ops: Vec<AsyncOpCompletion>,
}

impl Completions {
    pub fn new() -> Self {
        Self {
            async_syscalls: vec![],
            async_ops: vec![],
        }
    }
}

#[derive(Debug)]
pub struct PendingAsyncSyscall {
    pub promise_id: PromiseId,
    pub name: String,
    pub args: JsonValue,
}

#[derive(Debug)]
pub struct AsyncSyscallCompletion {
    pub promise_id: PromiseId,
    pub result: anyhow::Result<String>,
}

#[derive(Debug)]
pub struct PendingAsyncOp {
    pub promise_id: PromiseId,
    pub request: AsyncOpRequest,
}

#[derive(Debug)]
pub struct AsyncOpCompletion {
    pub promise_id: PromiseId,
    pub result: anyhow::Result<TaskResponseEnum>,
}

#[derive(Debug)]
pub struct PendingDynamicImport {
    pub promise_id: PromiseId,
    pub specifier: ModuleSpecifier,
}

pub type QueryId = u32;

pub struct IsolateThreadClient<RT: Runtime> {
    rt: RT,
    sender: mpsc::Sender<IsolateThreadRequest>,
    user_timeout: Duration,
    user_time_remaining: Duration,
    semaphore: Arc<Semaphore>,
}

impl<RT: Runtime> IsolateThreadClient<RT> {
    pub fn new(
        rt: RT,
        sender: mpsc::Sender<IsolateThreadRequest>,
        user_timeout: Duration,
        semaphore: Arc<Semaphore>,
    ) -> Self {
        Self {
            rt,
            sender,
            user_timeout,
            user_time_remaining: user_timeout,
            semaphore,
        }
    }

    pub fn execution_time(&self) -> anyhow::Result<FunctionExecutionTime> {
        if self.user_time_remaining.is_zero() {
            anyhow::bail!("User time exhausted");
        }
        let elapsed = self.user_timeout - self.user_time_remaining;
        Ok(FunctionExecutionTime {
            elapsed,
            limit: self.user_timeout,
        })
    }

    pub async fn send<T>(
        &mut self,
        request: IsolateThreadRequest,
        rx: oneshot::Receiver<anyhow::Result<T>>,
    ) -> anyhow::Result<T> {
        if self.user_time_remaining.is_zero() {
            anyhow::bail!("User time exhausted");
        }

        // Use the semaphore to ensure that a bounded number of isolate
        // threads are executing at any point in time.
        let permit = self.semaphore.clone().acquire_owned().await?;

        // Start the user timer after we acquire the permit.
        let user_start = Instant::now();
        let user_timeout = self.rt.wait(self.user_time_remaining);
        if let Err(e) = self.sender.try_send(request) {
            match e {
                TrySendError::Full(_) => anyhow::bail!("Isolate thread queue is full"),
                TrySendError::Closed(_) => anyhow::bail!("Isolate thread was dropped"),
            }
        }
        let result = tokio::select! {
            result = rx => result,
            _ = user_timeout => {
                // XXX: We need to terminate the isolate handle here in
                // case user code is in an infinite loop.
                anyhow::bail!("User time exhausted");
            },
        };

        // Deduct the time spent in the isolate thread from our remaining user time.
        let user_elapsed = user_start.elapsed();
        self.user_time_remaining = self.user_time_remaining.saturating_sub(user_elapsed);

        // Drop the permit once we've received the response, allowing another
        // Tokio thread to talk to its V8 thread.
        drop(permit);

        result?
    }

    pub async fn register_module(
        &mut self,
        name: ModuleSpecifier,
        source: String,
        source_map: Option<String>,
    ) -> anyhow::Result<Vec<ModuleSpecifier>> {
        let (tx, rx) = oneshot::channel();
        self.send(
            IsolateThreadRequest::RegisterModule {
                name,
                source,
                source_map,
                response: tx,
            },
            rx,
        )
        .await
    }

    pub async fn evaluate_module(&mut self, name: ModuleSpecifier) -> anyhow::Result<()> {
        let (tx, rx) = oneshot::channel();
        self.send(
            IsolateThreadRequest::EvaluateModule { name, response: tx },
            rx,
        )
        .await
    }

    pub async fn start_function(
        &mut self,
        udf_type: UdfType,
        udf_path: CanonicalizedUdfPath,
        arguments: ConvexArray,
    ) -> anyhow::Result<(FunctionId, EvaluateResult)> {
        let (tx, rx) = oneshot::channel();
        self.send(
            IsolateThreadRequest::StartFunction {
                udf_type,
                udf_path,
                arguments,
                response: tx,
            },
            rx,
        )
        .await
    }

    pub async fn poll_function(
        &mut self,
        function_id: FunctionId,
        completions: Completions,
    ) -> anyhow::Result<EvaluateResult> {
        let (tx, rx) = oneshot::channel();
        self.send(
            IsolateThreadRequest::PollFunction {
                function_id,
                completions,
                response: tx,
            },
            rx,
        )
        .await
    }

    pub async fn shutdown(&mut self) -> anyhow::Result<EnvironmentOutcome> {
        let (tx, rx) = oneshot::channel();
        self.send(IsolateThreadRequest::Shutdown { response: tx }, rx)
            .await
    }
}
