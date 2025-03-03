pub mod definition;
pub mod handles;

use std::collections::BTreeMap;

use serde::{
    Deserialize,
    Serialize,
};
use value::{
    codegen_convex_serialization,
    identifier::Identifier,
    DeveloperDocumentId,
};

use crate::components::{
    ComponentName,
    Resource,
    SerializedResource,
};

#[derive(Debug, Clone, Eq, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub struct ComponentMetadata {
    pub definition_id: DeveloperDocumentId,
    pub component_type: ComponentType,
    pub state: ComponentState,
}

#[derive(Debug, Clone, Eq, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum ComponentState {
    /// The component is mounted and can be used.
    Active,
    /// The component is unmounted. Component functions are not available, and
    /// tables in the component are read-only.
    Unmounted,
}

impl ComponentMetadata {
    pub fn parent_and_name(&self) -> Option<(DeveloperDocumentId, ComponentName)> {
        match &self.component_type {
            ComponentType::App => None,
            ComponentType::ChildComponent { parent, name, .. } => Some((*parent, name.clone())),
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum ComponentType {
    App,
    ChildComponent {
        parent: DeveloperDocumentId,
        name: ComponentName,
        args: BTreeMap<Identifier, Resource>,
    },
}

impl ComponentType {
    pub fn is_root(&self) -> bool {
        matches!(self, ComponentType::App)
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SerializedComponentMetadata {
    pub definition_id: String,
    pub parent: Option<String>,
    pub name: Option<String>,
    pub args: Option<Vec<(String, SerializedResource)>>,
    pub state: Option<String>,
}

impl TryFrom<ComponentMetadata> for SerializedComponentMetadata {
    type Error = anyhow::Error;

    fn try_from(m: ComponentMetadata) -> anyhow::Result<Self> {
        let (parent, name, args) = match m.component_type {
            ComponentType::App => (None, None, None),
            ComponentType::ChildComponent { parent, name, args } => (
                Some(parent.to_string()),
                Some(name.to_string()),
                Some(
                    args.into_iter()
                        .map(|(k, v)| anyhow::Ok((k.to_string(), v.try_into()?)))
                        .try_collect()?,
                ),
            ),
        };
        let state = match m.state {
            ComponentState::Active => "active",
            ComponentState::Unmounted => "unmounted",
        };
        Ok(Self {
            definition_id: m.definition_id.to_string(),
            parent,
            name,
            args,
            state: Some(state.to_string()),
        })
    }
}

impl TryFrom<SerializedComponentMetadata> for ComponentMetadata {
    type Error = anyhow::Error;

    fn try_from(m: SerializedComponentMetadata) -> anyhow::Result<Self> {
        let component_type = match (m.parent, m.name, m.args) {
            (None, None, None) => ComponentType::App,
            (Some(parent), Some(name), Some(args)) => ComponentType::ChildComponent {
                parent: parent.parse()?,
                name: name.parse()?,
                args: args
                    .into_iter()
                    .map(|(k, v)| Ok((k.parse()?, v.try_into()?)))
                    .collect::<anyhow::Result<_>>()?,
            },
            _ => anyhow::bail!("Invalid component type"),
        };
        let state = match m.state.as_deref() {
            None | Some("active") => ComponentState::Active,
            Some("unmounted") => ComponentState::Unmounted,
            Some(invalid_state) => anyhow::bail!("Invalid component state: {invalid_state}"),
        };
        Ok(Self {
            definition_id: m.definition_id.parse()?,
            component_type,
            state,
        })
    }
}

codegen_convex_serialization!(ComponentMetadata, SerializedComponentMetadata);
