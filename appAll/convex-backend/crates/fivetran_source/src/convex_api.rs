use std::{
    collections::BTreeMap,
    fmt::Display,
    sync::LazyLock,
};

use anyhow::Context;
use async_trait::async_trait;
use convex_fivetran_common::config::Config;
use derive_more::{
    Display,
    From,
    Into,
};
use headers::{
    HeaderName,
    HeaderValue,
};
use maplit::btreemap;
use serde::{
    de::DeserializeOwned,
    Deserialize,
    Serialize,
};
use serde_json::Value as JsonValue;

#[allow(clippy::declare_interior_mutable_const)]
const CONVEX_CLIENT_HEADER: HeaderName = HeaderName::from_static("convex-client");

static CONVEX_CLIENT_HEADER_VALUE: LazyLock<HeaderValue> = LazyLock::new(|| {
    let connector_version = env!("CARGO_PKG_VERSION");
    HeaderValue::from_str(&format!("fivetran-export-{connector_version}")).unwrap()
});

/// The APIs exposed by a Convex backend for streaming export.
#[async_trait]
pub trait Source: Display + Send {
    /// An endpoint that confirms the Convex backend is accessible with
    /// streaming export enabled
    async fn test_streaming_export_connection(&self) -> anyhow::Result<()>;

    /// See https://docs.convex.dev/http-api/#get-apilist_snapshot
    async fn list_snapshot(
        &self,
        snapshot: Option<i64>,
        cursor: Option<ListSnapshotCursor>,
        table_name: Option<String>,
    ) -> anyhow::Result<ListSnapshotResponse>;

    /// See https://docs.convex.dev/http-api/#get-apidocument_deltas
    async fn document_deltas(
        &self,
        cursor: DocumentDeltasCursor,
        table_name: Option<String>,
    ) -> anyhow::Result<DocumentDeltasResponse>;

    /// Get a list of columns for each table on the Convex backend.
    async fn get_tables_and_columns(&self) -> anyhow::Result<BTreeMap<TableName, Vec<FieldName>>>;
}

/// Implementation of [`Source`] accessing a real Convex deployment over HTTP.
pub struct ConvexApi {
    pub config: Config,
}

impl ConvexApi {
    /// Performs a GET HTTP request to a given endpoint of the Convex API using
    /// the given query parameters.
    async fn get<T: DeserializeOwned>(
        &self,
        endpoint: &str,
        parameters: BTreeMap<&str, Option<String>>,
    ) -> anyhow::Result<T> {
        let non_null_parameters: BTreeMap<&str, String> = parameters
            .into_iter()
            .filter_map(|(key, value)| value.map(|value| (key, value)))
            .collect();

        let mut url = self
            .config
            .deploy_url
            .join("api/")
            .unwrap()
            .join(endpoint)
            .unwrap();

        url.query_pairs_mut().extend_pairs(non_null_parameters);

        match reqwest::Client::new()
            .get(url)
            .header(CONVEX_CLIENT_HEADER, &*CONVEX_CLIENT_HEADER_VALUE)
            .header(
                reqwest::header::AUTHORIZATION,
                format!("Convex {}", self.config.deploy_key),
            )
            .send()
            .await
        {
            Ok(resp) if resp.status().is_success() => Ok(resp
                .json::<T>()
                .await
                .context("Failed to deserialize query result")?),
            Ok(resp) => {
                if let Ok(text) = resp.text().await {
                    anyhow::bail!(
                        "Call to {endpoint} on {} returned an unsuccessful response: {text}",
                        self.config.deploy_url
                    )
                } else {
                    anyhow::bail!(
                        "Call to {endpoint} on {} returned no response",
                        self.config.deploy_url
                    )
                }
            },
            Err(e) => anyhow::bail!(e.to_string()),
        }
    }
}

#[async_trait]
impl Source for ConvexApi {
    async fn test_streaming_export_connection(&self) -> anyhow::Result<()> {
        self.get("test_streaming_export_connection", btreemap! {})
            .await
    }

    async fn list_snapshot(
        &self,
        snapshot: Option<i64>,
        cursor: Option<ListSnapshotCursor>,
        table_name: Option<String>,
    ) -> anyhow::Result<ListSnapshotResponse> {
        self.get(
            "list_snapshot",
            btreemap! {
                "snapshot" => snapshot.map(|n| n.to_string()),
                "cursor" => cursor.map(|n| n.to_string()),
                "tableName" => table_name,
                "format" => Some("convex_encoded_json".to_string()),
            },
        )
        .await
    }

    async fn document_deltas(
        &self,
        cursor: DocumentDeltasCursor,
        table_name: Option<String>,
    ) -> anyhow::Result<DocumentDeltasResponse> {
        self.get(
            "document_deltas",
            btreemap! {
                "cursor" => Some(cursor.to_string()),
                "tableName" => table_name,
                "format" => Some("convex_encoded_json".to_string()),
            },
        )
        .await
    }

    async fn get_tables_and_columns(&self) -> anyhow::Result<BTreeMap<TableName, Vec<FieldName>>> {
        let tables_to_columns: BTreeMap<TableName, Vec<String>> =
            self.get("get_tables_and_columns", btreemap! {}).await?;

        tables_to_columns
            .into_iter()
            .map(|(table_name, all_columns)| {
                let system_columns = ["_id", "_creationTime"].into_iter().map(String::from);
                let user_columns: Vec<_> = all_columns
                    .into_iter()
                    .filter(|key| !key.starts_with('_'))
                    .collect();

                let columns = system_columns.chain(user_columns).map(FieldName).collect();

                Ok((table_name, columns))
            })
            .try_collect()
    }
}

impl Display for ConvexApi {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.config.deploy_url.as_ref())
    }
}

#[derive(Display, Serialize, Deserialize, Debug, PartialEq, Eq, Clone, From, Into)]
#[cfg_attr(test, derive(proptest_derive::Arbitrary))]
pub struct ListSnapshotCursor(pub String);

#[derive(Display, Serialize, Deserialize, Debug, PartialEq, Eq, Clone, From, Into, Copy)]
#[cfg_attr(test, derive(proptest_derive::Arbitrary))]
pub struct DocumentDeltasCursor(pub i64);

#[derive(Deserialize, PartialEq, Eq, PartialOrd, Ord, Hash, Display)]
pub struct TableName(pub String);

#[cfg(test)]
impl From<&str> for TableName {
    fn from(value: &str) -> Self {
        TableName(value.to_string())
    }
}

#[derive(Display)]
pub struct FieldName(pub String);

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSnapshotResponse {
    /// Documents, in (id, ts) order.
    pub values: Vec<SnapshotValue>,
    /// Timestamp snapshot. Pass this in as `snapshot` to subsequent API calls.
    pub snapshot: i64,
    /// Exclusive timestamp for passing in as `cursor` to subsequent API calls.
    pub cursor: Option<String>,
    /// Continue calling the API while has_more is true.
    /// When this becomes false, the `ListSnapshotResponse.snapshot` can be used
    /// as `DocumentDeltasArgs.cursor` to get deltas after the snapshot.
    pub has_more: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentDeltasResponse {
    /// Document deltas, in timestamp order.
    pub values: Vec<SnapshotValue>,
    /// Exclusive timestamp for passing in as `cursor` to subsequent API calls.
    pub cursor: i64,
    /// Continue calling the API while has_more is true.
    pub has_more: bool,
}

/// A value returned by the list snapshot and document deltas API.
/// This corresponds to a Convex document with some special fields added.
#[derive(Deserialize, Debug, Clone)]
pub struct SnapshotValue {
    /// The name of the table this document is from.
    #[serde(rename = "_table")]
    pub table: String,

    /// In the document deltas API, this indicates whether the document was
    /// deleted. Will always be `false` in the list snapshot API.
    #[serde(rename = "_deleted", default)]
    pub deleted: bool,

    /// The fields of the document. Will be empty if `deleted == true`.
    /// This can contain some special system fields that are not part of the
    /// original document. All fields prefixed by `_` and that are not `_id` or
    /// `_creationTime` must be ignored.
    #[serde(flatten)]
    pub fields: BTreeMap<String, JsonValue>,
}

#[cfg(test)]
mod tests {
    use core::panic;

    use schemars::schema::Schema;
    use serde_json::json;

    use super::*;

    #[derive(Deserialize)]
    pub struct DatabaseSchema(pub BTreeMap<TableName, Schema>);

    #[test]
    fn can_deserialize_schema() {
        let json = json!({
            "emptyTable": false,
            "table": json!({
                "type": "object",
                "properties": json!({
                    "_creationTime": json!({ "type": "number" }),
                    "_id": json!({
                        "$description": "Id(messages)",
                        "type": "string"
                    }),
                    "author": json!({ "type": "string" }),
                    "body": json!({ "type": "string" }),
                    "_table": json!({ "type": "string" }),
                    "_ts": json!({ "type": "integer" }),
                    "_deleted": json!({ "type": "boolean" }),
                }),
                "additionalProperties": false,
                "required": vec!["_creationTime", "_id", "author", "body"],
                "$schema": "http://json-schema.org/draft-07/schema#",
            }),
        });

        let schema: DatabaseSchema = serde_json::from_value(json).unwrap();

        let Schema::Bool(_) = schema.0.get(&"emptyTable".into()).unwrap() else {
            panic!();
        };
        let Schema::Object(schema_object) = schema.0.get(&"table".into()).unwrap() else {
            panic!();
        };
        assert!(schema_object.object.is_some());
    }
}
