use value::heap_size::HeapSize;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub struct TableStats {
    pub rows_read: u64,
    pub rows_written: u64,
    pub rows_created: u64,
    pub rows_deleted: u64,
}

impl HeapSize for TableStats {
    fn heap_size(&self) -> usize {
        0
    }
}
