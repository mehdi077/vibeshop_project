use std::{
    collections::BTreeMap,
    str::FromStr,
};

use maplit::btreemap;
use must_let::must_let;
use serde_json::json;
use shape_inference::{
    testing::TestConfig,
    CountedShape,
};
use value::{
    assert_obj,
    id_v6::DeveloperDocumentId,
    ConvexValue,
    TableName,
    TableNamespace,
};

use crate::{
    shapes::{
        dashboard_shape_json,
        reduced::ReducedShape,
    },
    testing::TestIdGenerator,
    virtual_system_mapping::VirtualSystemMapping,
};

#[test]
fn test_map_reduce_type() -> anyhow::Result<()> {
    let mut s = CountedShape::<TestConfig>::empty();

    let empty_obj = assert_obj!("fields" => ConvexValue::Map(BTreeMap::new().try_into()?));

    let nonempty_obj = assert_obj!("fields" => ConvexValue::Map(btreemap!{
        ConvexValue::try_from("hi")? => ConvexValue::try_from("there")?
    }.try_into()?));

    s = s.insert(&empty_obj);
    s = s.insert(&nonempty_obj);

    let reduced = ReducedShape::from_type(&s, &|_| false);

    must_let!(let ReducedShape::Object(fields) = reduced);
    let field = fields.get("fields").unwrap();
    assert!(!field.optional);
    must_let!(let ReducedShape::Map {..} = &field.shape);

    Ok(())
}

// CX-1550 was a bug in our `reduce` logic with reducing object shapes with
// union shapes as their fields.
//
// With the example below, we'd reduce each individual shape to...
// ```
// {field: string | number}
// {field: string | null}
// ```
// Then, when unifying the "field" types, we'd look at the first shape and set
// our accumulated union type for field to a singleton union of (string |
// number). Then, adding the second field shape (string | null) would end up
// with the nested union shape (null | (string | number)), which is illegal.
#[test]
fn test_cx_1550() -> anyhow::Result<()> {
    let x = [
        r#"[{"field": "1"}, {"field": 2.0}]"#,
        r#"[{"field": "3"}, {}]"#,
    ];
    let mut shape = CountedShape::<TestConfig>::empty();
    for value in x {
        let value = parse_json_string(value)?;
        shape = shape.insert_value(&value);
    }
    let reduced = ReducedShape::from_type(&shape, &|_| false);
    must_let!(let ReducedShape::Array(items) = reduced);
    must_let!(let ReducedShape::Object(fields) = *items);
    let field = fields.get("field").unwrap();
    assert!(field.optional);
    must_let!(let ReducedShape::Union(union_shapes) = &field.shape);
    assert_eq!(union_shapes.len(), 2);
    must_let!(let ReducedShape::Float64(_) = union_shapes.first().unwrap());
    must_let!(let ReducedShape::String = union_shapes.last().unwrap());
    Ok(())
}

#[test]
fn test_id_strings() -> anyhow::Result<()> {
    let mut id_generator = TestIdGenerator::new();

    // Create three IDs from three different tables
    let message_id: DeveloperDocumentId = id_generator
        .user_generate(&TableName::from_str("messages")?)
        .into();
    let deleted1_table = TableName::from_str("deleted1")?;
    let deleted2_table = TableName::from_str("deleted2")?;
    let deleted1_id: DeveloperDocumentId = id_generator.user_generate(&deleted1_table).into();
    let deleted2_id: DeveloperDocumentId = id_generator.user_generate(&deleted2_table).into();
    let table_mapping = id_generator.namespace(TableNamespace::test_user());

    // Delete two of the tables
    let deleted1_table_id = table_mapping.id(&deleted1_table)?;
    id_generator.remove(deleted1_table_id.tablet_id);
    let deleted2_table_id = table_mapping.id(&deleted2_table)?;
    id_generator.remove(deleted2_table_id.tablet_id);
    let table_mapping = id_generator.namespace(TableNamespace::test_user());

    // Insert all of these into a type
    let inferred_type = CountedShape::<TestConfig>::empty()
        .insert_value(&message_id.into())
        .insert_value(&deleted1_id.into())
        .insert_value(&deleted2_id.into());

    let reduced_shape =
        ReducedShape::from_type(&inferred_type, &table_mapping.table_number_exists());
    let shape_json = dashboard_shape_json(
        &reduced_shape,
        &id_generator.namespace(TableNamespace::test_user()),
        &id_generator.virtual_system_mapping,
    )?;
    assert_eq!(
        shape_json,
        json!({"type": "Union", "shapes": vec![
            json!({ "type": "Id", "tableName": "messages"}),
            json!({ "type": "String" }),
        ]})
    );
    Ok(())
}

#[test]
fn test_float_merge_shape_inference() -> anyhow::Result<()> {
    let id_generator = TestIdGenerator::new();

    let inferred_type = CountedShape::<TestConfig>::empty()
        .insert_value(&ConvexValue::Float64(f64::INFINITY))
        .insert_value(&ConvexValue::Float64(123.0))
        .insert_value(&ConvexValue::Null);
    let table_mapping = id_generator.namespace(TableNamespace::test_user());

    let reduced_shape =
        ReducedShape::from_type(&inferred_type, &table_mapping.table_number_exists());
    let shape_json = dashboard_shape_json(
        &reduced_shape,
        &id_generator.namespace(TableNamespace::test_user()),
        &VirtualSystemMapping::default(),
    )?;
    assert_eq!(
        shape_json,
        json!({"type": "Union", "shapes": vec![
            json!({ "type": "Null" }),
            json!({ "type": "Float64", "float64Range": { "hasSpecialValues": true} }),
        ]})
    );
    Ok(())
}

fn parse_json_string(s: &str) -> anyhow::Result<ConvexValue> {
    let json_v: serde_json::Value = serde_json::from_str(s)?;
    parse_json(json_v)
}

fn parse_json(json_v: serde_json::Value) -> anyhow::Result<ConvexValue> {
    ConvexValue::try_from(json_v)
}

mod reduce {
    use cmd_util::env::env_config;
    use proptest::prelude::*;
    use shape_inference::{
        testing::TestConfig,
        CountedShape,
    };
    use value::ConvexValue;

    use super::parse_json_string;
    use crate::shapes::reduced::ReducedShape;

    fn test(first: ConvexValue, second: ConvexValue) {
        let shape = CountedShape::<TestConfig>::empty()
            .insert_value(&first)
            .insert_value(&second);
        ReducedShape::from_type(&shape, &|_| false);
    }

    proptest! {
        #![proptest_config(
            ProptestConfig { cases: 256 * env_config("CONVEX_PROPTEST_MULTIPLIER", 1), failure_persistence: None, ..ProptestConfig::default() }
        )]

        #[test]
        fn proptest(a in any::<ConvexValue>(), b in any::<ConvexValue>()) {
            test(a, b);
        }
    }

    #[test]
    fn proptest_trophies() -> anyhow::Result<()> {
        let trophies = [(r#"{"a": "b"}"#, r#"{"c": {}}"#)];
        for (first, second) in trophies.iter() {
            test(parse_json_string(first)?, parse_json_string(second)?);
        }
        Ok(())
    }
}
