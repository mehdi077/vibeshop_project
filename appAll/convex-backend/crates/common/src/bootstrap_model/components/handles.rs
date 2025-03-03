use std::str::FromStr;

use serde::{
    Deserialize,
    Serialize,
};
use sync_types::{
    CanonicalizedUdfPath,
    Timestamp,
};
use value::{
    codegen_convex_serialization,
    DeveloperDocumentId,
};

use crate::components::ComponentId;

#[derive(Debug, Clone, PartialEq, Eq, Ord, PartialOrd, Hash)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub struct FunctionHandleMetadata {
    pub component: ComponentId,
    pub path: CanonicalizedUdfPath,

    // We keep function handle tombstones around when a function is deleted so we can revive it if
    // the function is subsequently pushed. This keeps handles working if the developer deletes and
    // recreates a function.
    pub deleted_ts: Option<Timestamp>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerializedFunctionHandleMetadata {
    pub component: Option<String>,
    pub path: String,
    pub deleted_ts: Option<i64>,
}

impl TryFrom<FunctionHandleMetadata> for SerializedFunctionHandleMetadata {
    type Error = anyhow::Error;

    fn try_from(m: FunctionHandleMetadata) -> anyhow::Result<Self> {
        Ok(Self {
            component: m.component.serialize_to_string(),
            path: m.path.to_string(),
            deleted_ts: m.deleted_ts.map(|ts| ts.into()),
        })
    }
}

impl TryFrom<SerializedFunctionHandleMetadata> for FunctionHandleMetadata {
    type Error = anyhow::Error;

    fn try_from(m: SerializedFunctionHandleMetadata) -> anyhow::Result<Self> {
        Ok(Self {
            component: ComponentId::deserialize_from_string(m.component.as_deref())?,
            path: m.path.parse()?,
            deleted_ts: m.deleted_ts.map(|ts| ts.try_into()).transpose()?,
        })
    }
}

codegen_convex_serialization!(FunctionHandleMetadata, SerializedFunctionHandleMetadata);

pub const FUNCTION_HANDLE_PREFIX: &str = "function://";

#[derive(Debug, Clone, PartialEq, Eq, Ord, PartialOrd, Hash)]
pub struct FunctionHandle(DeveloperDocumentId);

impl FunctionHandle {
    pub fn new(handle_id: DeveloperDocumentId) -> Self {
        Self(handle_id)
    }
}

impl From<FunctionHandle> for DeveloperDocumentId {
    fn from(handle: FunctionHandle) -> Self {
        handle.0
    }
}

impl From<FunctionHandle> for String {
    fn from(handle: FunctionHandle) -> Self {
        format!("{}{}", FUNCTION_HANDLE_PREFIX, String::from(handle.0))
    }
}

impl FromStr for FunctionHandle {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let Some(suffix) = s.strip_prefix(FUNCTION_HANDLE_PREFIX) else {
            anyhow::bail!("Invalid function handle {s}");
        };
        Ok(Self(suffix.parse()?))
    }
}
