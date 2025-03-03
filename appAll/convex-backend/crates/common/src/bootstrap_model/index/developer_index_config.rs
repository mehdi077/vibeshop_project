use std::fmt::Debug;

use serde::{
    Deserialize,
    Serialize,
};
use value::codegen_convex_serialization;

use super::{
    database_index::{
        DeveloperDatabaseIndexConfig,
        SerializedDeveloperDatabaseIndexConfig,
    },
    text_index::{
        DeveloperTextIndexConfig,
        SerializedDeveloperTextIndexConfig,
    },
    vector_index::{
        DeveloperVectorIndexConfig,
        SerializedDeveloperVectorIndexConfig,
    },
    IndexConfig,
};

// Index config that's specified by the developer
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum DeveloperIndexConfig {
    /// Standard database index.
    Database(DeveloperDatabaseIndexConfig),

    /// Full text search index.
    Search(DeveloperTextIndexConfig),

    Vector(DeveloperVectorIndexConfig),
}

impl From<IndexConfig> for DeveloperIndexConfig {
    fn from(value: IndexConfig) -> Self {
        match value {
            IndexConfig::Database {
                developer_config, ..
            } => DeveloperIndexConfig::Database(developer_config),
            IndexConfig::Text {
                developer_config, ..
            } => DeveloperIndexConfig::Search(developer_config),
            IndexConfig::Vector {
                developer_config, ..
            } => DeveloperIndexConfig::Vector(developer_config),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub struct SerializedNamedDeveloperIndexConfig {
    pub name: String,
    #[serde(flatten)]
    pub index_config: SerializedDeveloperIndexConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum SerializedDeveloperIndexConfig {
    Database {
        #[serde(flatten)]
        config: SerializedDeveloperDatabaseIndexConfig,
    },
    Search {
        #[serde(flatten)]
        config: SerializedDeveloperTextIndexConfig,
    },
    Vector {
        #[serde(flatten)]
        config: SerializedDeveloperVectorIndexConfig,
    },
}

impl TryFrom<DeveloperIndexConfig> for SerializedDeveloperIndexConfig {
    type Error = anyhow::Error;

    fn try_from(index_config: DeveloperIndexConfig) -> anyhow::Result<Self> {
        Ok(match index_config {
            DeveloperIndexConfig::Database(config) => Self::Database {
                config: config.try_into()?,
            },
            DeveloperIndexConfig::Search(config) => Self::Search {
                config: config.try_into()?,
            },
            DeveloperIndexConfig::Vector(config) => Self::Vector {
                config: config.try_into()?,
            },
        })
    }
}

impl TryFrom<SerializedDeveloperIndexConfig> for DeveloperIndexConfig {
    type Error = anyhow::Error;

    fn try_from(index_config: SerializedDeveloperIndexConfig) -> anyhow::Result<Self> {
        Ok(match index_config {
            SerializedDeveloperIndexConfig::Database { config } => {
                Self::Database(config.try_into()?)
            },
            SerializedDeveloperIndexConfig::Search { config } => Self::Search(config.try_into()?),
            SerializedDeveloperIndexConfig::Vector { config } => Self::Vector(config.try_into()?),
        })
    }
}

codegen_convex_serialization!(DeveloperIndexConfig, SerializedDeveloperIndexConfig);
