#![cfg_attr(target_arch = "wasm32", no_std)]
#![cfg_attr(target_arch = "wasm32", no_main)]

extern crate alloc;

#[cfg(target_arch = "wasm32")]
mod contract {
    include!("contract_wasm.rs");
}

#[cfg(target_arch = "wasm32")]
pub use contract::*;

#[cfg(not(target_arch = "wasm32"))]
pub fn _host_build_placeholder() {}
