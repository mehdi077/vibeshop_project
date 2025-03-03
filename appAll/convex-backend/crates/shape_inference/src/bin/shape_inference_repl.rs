use std::{
    env,
    io::{
        self,
        Write,
    },
};

use serde_json::Value as JsonValue;
use shape_inference::{
    CountedShape,
    ProdConfigWithOptionalFields,
    Shape,
    ShapeConfig,
};
use value::ConvexValue;
#[cfg(feature = "testing")]
use value::IdentifierFieldName;

#[derive(Copy, Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
enum SmallConfig {}

impl ShapeConfig for SmallConfig {
    const MAX_OBJECT_FIELDS: usize = 4;
    const MAX_UNION_LENGTH: usize = 4;

    fn is_valid_string_literal(s: &str) -> bool {
        ProdConfigWithOptionalFields::is_valid_string_literal(s)
    }

    fn allow_optional_object_fields() -> bool {
        ProdConfigWithOptionalFields::allow_optional_object_fields()
    }

    #[cfg(feature = "testing")]
    fn string_literal_strategy() -> proptest::strategy::BoxedStrategy<String> {
        ProdConfigWithOptionalFields::string_literal_strategy()
    }

    #[cfg(feature = "testing")]
    fn object_field_strategy() -> proptest::strategy::BoxedStrategy<IdentifierFieldName> {
        ProdConfigWithOptionalFields::object_field_strategy()
    }
}

fn repl<C: ShapeConfig>() -> anyhow::Result<()> {
    let mut shape: CountedShape<C> = Shape::empty();
    println!("Max union length: {}", C::MAX_UNION_LENGTH);
    println!("Max object fields: {}", C::MAX_OBJECT_FIELDS);
    loop {
        let mut buffer = String::new();
        print!("> ");
        io::stdout().flush()?;
        io::stdin().read_line(&mut buffer)?;
        if buffer.starts_with("insert ") {
            let v: JsonValue = match serde_json::from_str(buffer.trim_start_matches("insert ")) {
                Ok(v) => v,
                Err(e) => {
                    println!("Invalid value: {e:?}");
                    continue;
                },
            };
            let value = ConvexValue::try_from(v)?;
            shape = shape.insert_value(&value);
            println!("=> {shape}");
        } else if buffer.starts_with("remove ") {
            let v: JsonValue = match serde_json::from_str(buffer.trim_start_matches("remove ")) {
                Ok(v) => v,
                Err(e) => {
                    println!("Invalid value: {e:?}");
                    continue;
                },
            };
            let value = ConvexValue::try_from(v)?;
            match shape.remove_value(&value) {
                Ok(s) => {
                    shape = s;
                    println!("=> {shape}");
                },
                Err(e) => println!("=> error {e:?}"),
            }
        } else {
            println!("invalid command (try insert or remove)");
        }
    }
}

fn main() -> anyhow::Result<()> {
    if env::args().nth(1).unwrap_or_default() == "small" {
        repl::<SmallConfig>()
    } else {
        repl::<ProdConfigWithOptionalFields>()
    }
}
