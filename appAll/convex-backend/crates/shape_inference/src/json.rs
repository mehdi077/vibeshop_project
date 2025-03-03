use std::{
    str::FromStr,
    sync::Arc,
};

use serde::Deserialize;
use serde_json::{
    json,
    Value as JsonValue,
};
use value::{
    IdentifierFieldName,
    TableNumber,
};

use crate::{
    array::ArrayShape,
    map::MapShape,
    object::{
        ObjectField,
        ObjectShape,
        RecordShape,
    },
    set::SetShape,
    string::StringLiteralShape,
    CountedShape,
    CountedShapeEnum,
    Shape,
    ShapeConfig,
    ShapeEnum,
    UnionBuilder,
};

impl<C: ShapeConfig> TryFrom<JsonValue> for CountedShape<C> {
    type Error = anyhow::Error;

    fn try_from(value: JsonValue) -> Result<Self, Self::Error> {
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct ShapeJson {
            num_values: u64,
            variant: JsonValue,
        }
        let shape: ShapeJson = serde_json::from_value(value)?;
        Ok(Shape {
            num_values: shape.num_values,
            variant: Arc::new(ShapeEnum::try_from(shape.variant)?),
        })
    }
}

impl<C: ShapeConfig> TryFrom<JsonValue> for CountedShapeEnum<C> {
    type Error = anyhow::Error;

    fn try_from(value: JsonValue) -> Result<Self, Self::Error> {
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct FieldPair {
            field_name: String,
            r#type: JsonValue,
        }

        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct ObjectFieldJson {
            r#type: JsonValue,
            optional: bool,
        }

        #[derive(Deserialize)]
        #[serde(tag = "kind")]
        enum ShapeEnumJson {
            Never,
            Null,
            Int64,
            Float64,
            NegativeInf,
            PositiveInf,
            NegativeZero,
            NaN,
            NormalFloat64,
            Boolean,
            StringLiteral {
                literal: String,
            },
            #[serde(rename_all = "camelCase")]
            Id {
                table_number: u32,
            },
            FieldName,
            String,
            Bytes,
            #[serde(rename_all = "camelCase")]
            Array {
                element_type: JsonValue,
            },
            #[serde(rename_all = "camelCase")]
            Set {
                element_type: JsonValue,
            },
            #[serde(rename_all = "camelCase")]
            Map {
                key_type: JsonValue,
                value_type: JsonValue,
            },
            #[serde(rename_all = "camelCase")]
            Object {
                fields: Vec<FieldPair>,
            },
            #[serde(rename_all = "camelCase")]
            Record {
                field_type: JsonValue,
                value_type: JsonValue,
            },
            Union {
                types: Vec<JsonValue>,
            },
            Unknown,
        }
        let shape_enum: ShapeEnumJson = serde_json::from_value(value)?;
        let result = match shape_enum {
            ShapeEnumJson::Never => ShapeEnum::Never,
            ShapeEnumJson::Null => ShapeEnum::Null,
            ShapeEnumJson::Int64 => ShapeEnum::Int64,
            ShapeEnumJson::Float64 => ShapeEnum::Float64,
            ShapeEnumJson::NegativeInf => ShapeEnum::NegativeInf,
            ShapeEnumJson::PositiveInf => ShapeEnum::PositiveInf,
            ShapeEnumJson::NegativeZero => ShapeEnum::NegativeZero,
            ShapeEnumJson::NaN => ShapeEnum::NaN,
            ShapeEnumJson::NormalFloat64 => ShapeEnum::NormalFloat64,
            ShapeEnumJson::Boolean => ShapeEnum::Boolean,
            ShapeEnumJson::StringLiteral { literal } => {
                let t = StringLiteralShape::shape_of(&literal);
                anyhow::ensure!(matches!(t, ShapeEnum::StringLiteral(_)));
                t
            },
            ShapeEnumJson::Id { table_number } => {
                ShapeEnum::Id(TableNumber::try_from(table_number)?)
            },
            ShapeEnumJson::FieldName => ShapeEnum::FieldName,
            ShapeEnumJson::String => ShapeEnum::String,
            ShapeEnumJson::Bytes => ShapeEnum::Bytes,
            ShapeEnumJson::Array { element_type } => {
                ShapeEnum::Array(ArrayShape::new(Shape::try_from(element_type)?))
            },
            ShapeEnumJson::Set { element_type } => {
                ShapeEnum::Set(SetShape::new(Shape::try_from(element_type)?))
            },
            ShapeEnumJson::Map {
                key_type,
                value_type,
            } => ShapeEnum::Map(MapShape::new(
                Shape::try_from(key_type)?,
                Shape::try_from(value_type)?,
            )),
            ShapeEnumJson::Object { fields } => ShapeEnum::Object(ObjectShape::<C, u64>::new(
                fields
                    .into_iter()
                    .map(|f| {
                        let field_name = IdentifierFieldName::from_str(&f.field_name)?;
                        let object_field = if C::allow_optional_object_fields() {
                            let object_field_json: ObjectFieldJson =
                                serde_json::from_value(f.r#type)?;
                            ObjectField {
                                value_shape: Shape::try_from(object_field_json.r#type)?,
                                optional: object_field_json.optional,
                            }
                        } else {
                            ObjectField {
                                value_shape: Shape::try_from(f.r#type)?,
                                optional: false,
                            }
                        };
                        anyhow::Ok((field_name, object_field))
                    })
                    .try_collect()?,
            )),
            ShapeEnumJson::Record {
                field_type,
                value_type,
            } => ShapeEnum::Record(RecordShape::new(
                Shape::try_from(field_type)?,
                Shape::try_from(value_type)?,
            )),
            ShapeEnumJson::Union { types } => {
                let mut builder = UnionBuilder::new();
                for t in types {
                    builder = builder.push(Shape::try_from(t)?);
                }

                let union_shape = builder.build();
                anyhow::ensure!(matches![union_shape.variant(), ShapeEnum::Union(..)]);
                union_shape.variant().clone()
            },

            ShapeEnumJson::Unknown => ShapeEnum::Unknown,
        };
        Ok(result)
    }
}

impl<C: ShapeConfig> From<&CountedShape<C>> for JsonValue {
    fn from(value: &CountedShape<C>) -> Self {
        value.to_json(true)
    }
}

impl<C: ShapeConfig> From<&CountedShapeEnum<C>> for JsonValue {
    fn from(value: &CountedShapeEnum<C>) -> Self {
        value.to_json(true)
    }
}

#[cfg(any(test, feature = "testing"))]
impl<C: ShapeConfig> From<CountedShape<C>> for JsonValue {
    fn from(value: CountedShape<C>) -> Self {
        JsonValue::from(&value)
    }
}

impl<C: ShapeConfig> CountedShape<C> {
    pub fn to_json(&self, include_pii: bool) -> JsonValue {
        json!({
            "numValues": self.num_values(),
            "variant": self.variant().to_json(include_pii),
        })
    }
}

impl<C: ShapeConfig> CountedShapeEnum<C> {
    pub fn to_json(&self, include_pii: bool) -> JsonValue {
        match self {
            ShapeEnum::Never => json!({"kind": "Never"}),
            ShapeEnum::Null => json!({"kind": "Null"}),
            ShapeEnum::Int64 => json!({"kind": "Int64"}),
            ShapeEnum::Float64 => json!({"kind": "Float64"}),
            ShapeEnum::NegativeInf => json!({"kind": "NegativeInf"}),
            ShapeEnum::PositiveInf => json!({"kind": "PositiveInf"}),
            ShapeEnum::NegativeZero => json!({"kind": "NegativeZero"}),
            ShapeEnum::NaN => json!({"kind": "NaN"}),
            ShapeEnum::NormalFloat64 => json!({"kind": "NormalFloat64"}),
            ShapeEnum::Boolean => json!({"kind": "Boolean"}),
            ShapeEnum::StringLiteral(ref s) => {
                if include_pii {
                    json!({"kind": "StringLiteral", "literal": s.to_string() })
                } else {
                    json!({"kind": "StringLiteral" })
                }
            },
            ShapeEnum::Id(table_number) => {
                json!({"kind": "Id", "tableNumber": u32::from(*table_number) })
            },
            ShapeEnum::FieldName => json!({"kind": "FieldName"}),
            ShapeEnum::String => json!({"kind": "String"}),
            ShapeEnum::Bytes => json!({"kind": "Bytes"}),
            ShapeEnum::Array(array_shape) => {
                json!({"kind": "Array", "elementType": array_shape.element().to_json(include_pii)})
            },
            ShapeEnum::Set(set_shape) => {
                json!({"kind": "Set", "elementType": set_shape.element().to_json(include_pii)})
            },
            ShapeEnum::Map(map_shape) => {
                json!({"kind": "Map", "keyType": map_shape.key().to_json(include_pii), "valueType": map_shape.value().to_json(include_pii)})
            },
            ShapeEnum::Object(object_shape) => {
                let field_json = object_shape
                    .iter()
                    .map(|(field_name, field)| {
                        let shape_json = if C::allow_optional_object_fields() {
                            json!({
                                "type": field.value_shape.to_json(include_pii),
                                "optional": field.optional
                            })
                        } else {
                            field.value_shape.to_json(include_pii)
                        };
                        json!({
                            "fieldName": String::from(field_name.clone()),
                            "type": shape_json
                        })
                    })
                    .collect::<Vec<_>>();
                json!({"kind": "Object", "fields": field_json})
            },
            ShapeEnum::Record(record_shape) => {
                json!({"kind": "Record", "fieldType": record_shape.field().to_json(include_pii), "valueType": record_shape.value().to_json(include_pii)})
            },
            ShapeEnum::Union(union_shape) => {
                json!({"kind": "Union", "types": union_shape.iter().map(|t| t.to_json(include_pii)).collect::<Vec<_>>()})
            },
            ShapeEnum::Unknown => json!({"kind": "Unknown"}),
        }
    }
}
