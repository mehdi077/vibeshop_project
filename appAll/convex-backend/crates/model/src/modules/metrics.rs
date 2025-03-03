use metrics::{
    register_convex_histogram,
    StatusTimer,
    STATUS_LABEL,
};

register_convex_histogram!(
    DATABASE_GET_MODULES_METADATA_SECONDS,
    "Time to get module metadata",
    &STATUS_LABEL
);
pub fn get_module_metadata_timer() -> StatusTimer {
    StatusTimer::new(&DATABASE_GET_MODULES_METADATA_SECONDS)
}
