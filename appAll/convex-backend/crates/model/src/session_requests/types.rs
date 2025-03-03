use std::collections::BTreeMap;

use anyhow::Context;
use common::{
    identity::InertIdentity,
    log_lines::{
        LogLine,
        LogLines,
    },
    obj,
    types::{
        SessionId,
        SessionRequestSeqNumber,
    },
    value::{
        json_deserialize,
        json_serialize,
        ConvexValue,
    },
};
use value::ConvexObject;

/// Identifier for a single request in a session
#[derive(Clone, Debug)]
#[cfg_attr(
    any(test, feature = "testing"),
    derive(proptest_derive::Arbitrary, PartialEq)
)]
pub struct SessionRequestIdentifier {
    pub session_id: SessionId,
    pub request_id: SessionRequestSeqNumber,
}

/// Information for a single session request
///
/// This is used to determine whether a session request has already been
/// processed.
#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub struct SessionRequestRecord {
    pub session_id: SessionId,
    pub request_id: SessionRequestSeqNumber,

    pub outcome: SessionRequestOutcome,

    /// Non-permission-granting representation of the identity input to the
    /// mutation.
    pub identity: InertIdentity,
}

impl TryFrom<SessionRequestRecord> for ConvexObject {
    type Error = anyhow::Error;

    fn try_from(request: SessionRequestRecord) -> anyhow::Result<Self> {
        obj!(
            "sessionId" => request.session_id.to_string(),
            "requestId" => (request.request_id as i64),
            "outcome" =>  ConvexValue::Object(request.outcome.try_into()?),
            "identity" => request.identity.to_string(),
        )
    }
}

impl TryFrom<ConvexObject> for SessionRequestRecord {
    type Error = anyhow::Error;

    fn try_from(object: ConvexObject) -> anyhow::Result<Self> {
        let mut fields: BTreeMap<_, _> = object.into();

        let session_id: SessionId = match fields.remove("sessionId") {
            Some(ConvexValue::String(s)) => s.parse()?,
            v => anyhow::bail!("Invalid sessionId field for SessionRequest: {:?}", v),
        };
        let request_id: SessionRequestSeqNumber = match fields.remove("requestId") {
            Some(ConvexValue::Int64(i)) => i.try_into()?,
            v => anyhow::bail!("Invalid requestId field for SessionRequest: {:?}", v),
        };
        let outcome: SessionRequestOutcome = match fields.remove("outcome") {
            Some(ConvexValue::Object(s)) => s.try_into()?,
            v => anyhow::bail!("Invalid result field for SessionRequest: {:?}", v),
        };
        let identity: InertIdentity = match fields.remove("identity") {
            Some(ConvexValue::String(s)) => s.to_string().parse()?,
            v => anyhow::bail!("Invalid identity field for SessionRequest: {:?}", v),
        };

        Ok(SessionRequestRecord {
            session_id,
            request_id,
            outcome,
            identity,
        })
    }
}

#[derive(Clone, Debug, PartialEq)]
#[cfg_attr(any(test, feature = "testing"), derive(proptest_derive::Arbitrary))]
pub enum SessionRequestOutcome {
    // In case of mutation, the session request is recorded atomically with
    // performing the mutation. There are no record for incomplete mutations.
    Mutation {
        result: ConvexValue,
        log_lines: LogLines,
    },
}

impl TryFrom<SessionRequestOutcome> for ConvexObject {
    type Error = anyhow::Error;

    fn try_from(outcome: SessionRequestOutcome) -> anyhow::Result<Self> {
        match outcome {
            SessionRequestOutcome::Mutation { result, log_lines } => {
                let log_lines: Vec<ConvexValue> = log_lines
                    .into_iter()
                    .map(ConvexValue::try_from)
                    .try_collect()?;

                let result_s = json_serialize(result)?;
                obj!(
                    "type" => "mutation",
                    "result" => result_s,
                    "logLines" => log_lines,
                )
            },
        }
    }
}

impl TryFrom<ConvexObject> for SessionRequestOutcome {
    type Error = anyhow::Error;

    fn try_from(object: ConvexObject) -> anyhow::Result<Self> {
        let mut fields: BTreeMap<_, _> = object.into();

        let udf_type = match fields.remove("type") {
            Some(ConvexValue::String(s)) => s,
            _ => anyhow::bail!(
                "Missing `type` field for SessionRequestOutcome: {:?}",
                fields
            ),
        };

        let outcome = match udf_type.to_string().as_str() {
            "mutation" => {
                let result: ConvexValue = match fields.remove("result") {
                    Some(ConvexValue::String(s)) => json_deserialize(&s)?,
                    v => anyhow::bail!("Invalid result field for SessionRequestOutcome: {:?}", v),
                };
                let log_lines: LogLines = match fields.remove("logLines") {
                    Some(ConvexValue::Array(a)) => a
                        .into_iter()
                        .map(|element| {
                            LogLine::try_from(element.clone()).with_context(|| {
                                anyhow::anyhow!(
                                    "Invalid log line inside SessionRequestOutcome: {:?}",
                                    element
                                )
                            })
                        })
                        .try_collect::<LogLines>()?,
                    v => anyhow::bail!("Invalid logLines field for SessionRequestOutcome: {:?}", v),
                };
                SessionRequestOutcome::Mutation { result, log_lines }
            },
            _ => anyhow::bail!(
                "Invalid `type` field for SessionRequestOutcome: {:?}",
                fields
            ),
        };

        Ok(outcome)
    }
}

#[cfg(test)]
mod tests {
    use cmd_util::env::env_config;
    use common::testing::assert_roundtrips;
    use proptest::prelude::*;
    use value::ConvexObject;

    use super::SessionRequestRecord;

    proptest! {
        #![proptest_config(
            ProptestConfig { cases: 256 * env_config("CONVEX_PROPTEST_MULTIPLIER", 1), failure_persistence: None, ..ProptestConfig::default() }
        )]
        #[test]
        fn test_session_request_roundtrips(v in any::<SessionRequestRecord>()) {
            assert_roundtrips::<SessionRequestRecord, ConvexObject>(v);
        }
    }
}
