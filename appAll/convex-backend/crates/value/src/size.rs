use errors::ErrorMetadata;
use humansize::{
    FormatSize,
    BINARY,
};

pub const MAX_SIZE: usize = 1 << 25; // 32 MB
pub const MAX_USER_SIZE: usize = 1 << 20; // 1MB
pub const MAX_NESTING: usize = 64;
pub const MAX_DOCUMENT_NESTING: usize = 16;
pub const VALUE_TOO_LARGE_SHORT_MSG: &str = "ValueTooLargeError";

/// Trait for enforcing different notions of "size" for values.
pub trait Size {
    /// How "large" is the given value? We define a (somewhat) arbitrary notion
    /// of size on `Value`s to bound the amount of memory our system uses
    /// per value.
    fn size(&self) -> usize;

    /// How "nested" is the given value? Primitive types, like integers, have
    /// nesting 0, while a list of integers has nesting 1, a list of list of
    /// integers has nesting 2, and so on.
    fn nesting(&self) -> usize;
}

pub fn check_system_size(size: usize) -> anyhow::Result<()> {
    if size > MAX_SIZE {
        // TODO CX-4516 - differentiate this from the check_user_size
        anyhow::bail!(ErrorMetadata::bad_request(
            VALUE_TOO_LARGE_SHORT_MSG,
            format!(
                "Value is too large ({} > maximum size {})",
                size.format_size(BINARY),
                MAX_SIZE.format_size(BINARY),
            )
        ));
    }
    Ok(())
}

pub fn check_user_size(size: usize) -> anyhow::Result<()> {
    if size > MAX_USER_SIZE {
        anyhow::bail!(ErrorMetadata::bad_request(
            VALUE_TOO_LARGE_SHORT_MSG,
            format!(
                "Value is too large ({} > maximum size {})",
                size.format_size(BINARY),
                MAX_USER_SIZE.format_size(BINARY),
            )
        ));
    }
    Ok(())
}

pub fn check_nesting(nesting: usize) -> anyhow::Result<()> {
    if nesting > MAX_NESTING {
        anyhow::bail!(ErrorMetadata::bad_request(
            "TooNestedError",
            format!(
                "Value is too nested (nested {nesting} levels deep > maximum nesting \
                 {MAX_NESTING})"
            )
        ))
    }
    Ok(())
}

pub fn check_nesting_for_documents(nesting: usize) -> bool {
    nesting > MAX_DOCUMENT_NESTING
}
