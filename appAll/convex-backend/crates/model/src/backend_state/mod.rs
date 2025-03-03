use std::sync::LazyLock;

use common::{
    document::{
        ParsedDocument,
        ResolvedDocument,
    },
    errors::JsError,
    query::{
        Order,
        Query,
    },
    runtime::Runtime,
};
use database::{
    ResolvedQuery,
    SystemMetadataModel,
    Transaction,
};
use errors::ErrorMetadata;
use value::{
    TableName,
    TableNamespace,
};

use crate::{
    SystemIndex,
    SystemTable,
};

pub mod types;

use types::BackendState;

use self::types::PersistedBackendState;

pub const PAUSED_ERROR_MESSAGE: &str = "Cannot run functions while this deployment is paused. \
                                        Resume the deployment in the dashboard settings to allow \
                                        functions to run.";

pub const DISABLED_ERROR_MESSAGE: &str = "You have exceeded the free plan limits, so your \
                                          deployments have been disabled. Please upgrade to a Pro \
                                          plan or reach out to us at support@convex.dev for help.";

pub const SUSPENDED_ERROR_MESSAGE: &str = "Cannot run functions while this deployment is \
                                           suspended. Please contact Convex if you believe this \
                                           is a mistake.";

pub static BACKEND_STATE_TABLE: LazyLock<TableName> = LazyLock::new(|| {
    "_backend_state"
        .parse()
        .expect("Invalid built-in backend_state table")
});

pub struct BackendStateTable;
impl SystemTable for BackendStateTable {
    fn table_name(&self) -> &'static TableName {
        &BACKEND_STATE_TABLE
    }

    fn indexes(&self) -> Vec<SystemIndex> {
        vec![]
    }

    fn validate_document(&self, document: ResolvedDocument) -> anyhow::Result<()> {
        ParsedDocument::<PersistedBackendState>::try_from(document).map(|_| ())
    }
}

pub struct BackendStateModel<'a, RT: Runtime> {
    tx: &'a mut Transaction<RT>,
}

impl<'a, RT: Runtime> BackendStateModel<'a, RT> {
    pub fn new(tx: &'a mut Transaction<RT>) -> Self {
        Self { tx }
    }

    pub async fn initialize(&mut self) -> anyhow::Result<()> {
        // Create _backend_state row initialized as running.
        SystemMetadataModel::new_global(self.tx)
            .insert(
                &BACKEND_STATE_TABLE,
                PersistedBackendState(BackendState::Running).try_into()?,
            )
            .await?;
        Ok(())
    }

    pub async fn get_backend_state(&mut self) -> anyhow::Result<BackendState> {
        let backend_state = self.get_backend_state_inner().await?;
        Ok(backend_state.into_value().0)
    }

    async fn get_backend_state_inner(
        &mut self,
    ) -> anyhow::Result<ParsedDocument<PersistedBackendState>> {
        let query = Query::full_table_scan(BACKEND_STATE_TABLE.clone(), Order::Asc);
        let mut query_stream = ResolvedQuery::new(self.tx, TableNamespace::Global, query)?;
        let doc = query_stream
            .next(self.tx, None)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Backend must have a state."))?;
        let backend_state: ParsedDocument<PersistedBackendState> = doc.try_into()?;
        anyhow::ensure!(
            query_stream.next(self.tx, None).await?.is_none(),
            "Backend must have a single state."
        );
        Ok(backend_state)
    }

    /// Fails with an error if the backend is not running. We have to return a
    /// result of a result of () and a JSError because we use them to
    /// differentiate between system and user errors.
    pub async fn fail_while_not_running(&mut self) -> anyhow::Result<Result<(), JsError>> {
        let backend_state = self.get_backend_state().await?;
        match backend_state {
            BackendState::Running => {},
            BackendState::Paused => {
                return Ok(Err(JsError::from_message(PAUSED_ERROR_MESSAGE.to_string())));
            },
            BackendState::Disabled => {
                return Ok(Err(JsError::from_message(
                    DISABLED_ERROR_MESSAGE.to_string(),
                )));
            },
            BackendState::Suspended => {
                return Ok(Err(JsError::from_message(
                    SUSPENDED_ERROR_MESSAGE.to_string(),
                )));
            },
        }

        Ok(Ok(()))
    }

    pub async fn toggle_backend_state(&mut self, new_state: BackendState) -> anyhow::Result<()> {
        let (id, current_state) = self.get_backend_state_inner().await?.into_id_and_value();
        anyhow::ensure!(
            current_state.0 != new_state,
            ErrorMetadata::bad_request(
                "DeploymentAlreadyInState",
                format!("Deployment is already {new_state}")
            )
        );
        SystemMetadataModel::new_global(self.tx)
            .replace(id, PersistedBackendState(new_state).try_into()?)
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use database::test_helpers::DbFixtures;
    use errors::{
        ErrorCode,
        ErrorMetadata,
    };
    use runtime::testing::TestRuntime;

    use crate::{
        backend_state::{
            types::BackendState,
            BackendStateModel,
        },
        test_helpers::DbFixturesWithModel,
    };

    #[convex_macro::test_runtime]
    async fn test_toggle_backend_state(rt: TestRuntime) -> anyhow::Result<()> {
        let db = DbFixtures::new_with_model(&rt).await?.db;
        let mut tx = db.begin_system().await?;
        let mut model = BackendStateModel::new(&mut tx);
        let starting_state = model.get_backend_state().await?;
        assert_eq!(starting_state, BackendState::Running);
        model.toggle_backend_state(BackendState::Paused).await?;
        let new_state = model.get_backend_state().await?;
        assert_eq!(new_state, BackendState::Paused);

        // Fail to toggle to the same state
        let err = model
            .toggle_backend_state(BackendState::Paused)
            .await
            .unwrap_err();
        let err = err.downcast_ref::<ErrorMetadata>().unwrap();
        assert_eq!(err.short_msg, "DeploymentAlreadyInState");
        assert_eq!(err.code, ErrorCode::BadRequest);
        Ok(())
    }
}
