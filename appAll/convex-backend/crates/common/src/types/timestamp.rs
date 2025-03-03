use std::{
    ops::Deref,
    time::Duration,
};

use anyhow::Context;
use pb::common::RepeatableTimestamp as RepeatableTimestampProto;
use sync_types::Timestamp;

/// WARNING: constructors of this struct must validate the timestamp is
/// repeatable -- according to the commit protocol -- in the constructor.
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
#[derive(Clone, Copy, Debug, derive_more::Display, Ord, PartialOrd, Eq, PartialEq)]
pub struct RepeatableTimestamp(Timestamp);

pub enum RepeatableReason {
    /// ts <= max_repeatable_ts from persistence globals.
    MaxRepeatableTsPersistence,
    /// ts = SnapshotManager.latest_ts()
    SnapshotManagerLatest,
    /// ts = TableSummarySnapshot.ts from persistence globals.
    TableSummarySnapshot,
    /// ts <= max_ts from persistence, and no Committer is running
    IdleMaxTs,
    /// ts <= some other RepeatableTimestamp
    InductiveRepeatableTimestamp,
    /// only in tests
    #[cfg(any(test, feature = "testing"))]
    TestOnly,
    /// only in db-info tool, and only when
    /// non-repeatable reads are directly requested.
    DbInfoManuallyRequested,
    /// RepeatableTimestamp serialized as a funrun::RepeatableTimestamp proto.
    /// The [FunctionRunner] requires a [`RepeatableTimestamp`] to create a
    /// [`DatabaseSnapshot`]. For now, the server trusts that the timestamp
    /// created in the client was repeatable. In the future, [FunctionRunner]
    /// can verify this.
    RepeatableTimestampProto,
}

impl RepeatableTimestamp {
    // Zero is always a valid RepeatableTimestamp.
    pub const MIN: RepeatableTimestamp = RepeatableTimestamp(Timestamp::MIN);

    /// Only call this constructor if you have validated the timestamp is
    /// repeatable. There should be very few callers of this function
    /// directly -- most should go through specialized constructors like
    /// new_static_repeatable_recent, unchecked_repeatable_ts, etc.
    ///
    /// Example of correct call-site:
    /// new_static_repeatable_recent reads the max_repeatable_ts persistence
    /// global, so the timestamp is guaranteed repeatable.
    ///
    /// Example of incorrect call-site:
    /// A timestamp is read from a cursor on IndexMetadata backfill state.
    /// Even though the cursor was probably valid when it was written, we
    /// should either
    /// (1) revalidate, or
    /// (2) pass through validation in the type system.
    /// To avoid issues where a non-repeatable Timestamp is
    /// serialized to u64 and deserialized as RepeatableTimestamp.
    pub fn new_validated(ts: Timestamp, _reason: RepeatableReason) -> Self {
        Self(ts)
    }

    pub fn prior_ts(&self, ts: Timestamp) -> anyhow::Result<Self> {
        anyhow::ensure!(ts <= *self);
        Ok(RepeatableTimestamp::new_validated(
            ts,
            RepeatableReason::InductiveRepeatableTimestamp,
        ))
    }

    pub fn sub(&self, duration: Duration) -> anyhow::Result<Self> {
        self.prior_ts((**self).sub(duration)?)
    }

    pub fn pred(&self) -> anyhow::Result<Self> {
        self.prior_ts((**self).pred()?)
    }
}

impl Deref for RepeatableTimestamp {
    type Target = Timestamp;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(any(test, feature = "testing"))]
pub fn unchecked_repeatable_ts(ts: Timestamp) -> RepeatableTimestamp {
    RepeatableTimestamp::new_validated(ts, RepeatableReason::TestOnly)
}

/// RepeatableTimestampProto should never be constructed directly. Always use
/// From<RepeatableTimestamp> to guarantee it's repeatable.
impl From<RepeatableTimestamp> for RepeatableTimestampProto {
    fn from(value: RepeatableTimestamp) -> Self {
        Self {
            ts: Some((*value).into()),
        }
    }
}

/// RepeatableTimestamps can be serialized and deserialized to proto.
/// When deserializing, we assume that the proto was originally serialized from
/// RepeatableTimestamp.
/// This should be a last resort. If possible, pass the timestamp through as a
/// plain u64 and re-validate when needed.
impl TryFrom<RepeatableTimestampProto> for RepeatableTimestamp {
    type Error = anyhow::Error;

    fn try_from(value: RepeatableTimestampProto) -> anyhow::Result<Self> {
        let ts = value.ts.context("RepeatableTimestampProto missing ts")?;
        Ok(RepeatableTimestamp::new_validated(
            ts.try_into()?,
            RepeatableReason::RepeatableTimestampProto,
        ))
    }
}

/// In some places, like indexing, it's useful to assign a "timestamp" to
/// uncommitted writes in a transaction. `WriteTimestamp` provides a safe way to
/// do so without risking confusing an uncommitted write with a committed one.
/// The `Pending` timestamp sorts greater than any committed timestamp.
#[derive(Clone, Copy, Ord, Eq, Debug, PartialEq, PartialOrd)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum WriteTimestamp {
    Committed(Timestamp),
    Pending,
}

#[cfg(test)]
mod tests {
    use cmd_util::env::env_config;
    use proptest::prelude::*;
    use sync_types::{
        testing::assert_roundtrips,
        Timestamp,
    };

    proptest! {
        #![proptest_config(ProptestConfig { cases: 256 * env_config("CONVEX_PROPTEST_MULTIPLIER", 1), failure_persistence: None, .. ProptestConfig::default() })]

        #[test]
        fn test_timestamp_roundtrips(ts in any::<Timestamp>()) {
            // Some databases encode as i64, some as u64, some as json.
            // Arbitrary Timestamps should be in a range that fits i64 and u64,
            // and serde_json should work for numbers > the max precise js integer.
            assert_roundtrips::<Timestamp, i64>(ts);
            assert_roundtrips::<Timestamp, u64>(ts);
            assert_roundtrips::<Timestamp, serde_json::Value>(ts);
        }
    }
}
