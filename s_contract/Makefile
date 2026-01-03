.PHONY: build test deploy clean

TOOLCHAIN ?= nightly-2025-02-04

CARGO := $(shell rustup which cargo --toolchain $(TOOLCHAIN))
RUSTC := $(shell rustup which rustc --toolchain $(TOOLCHAIN))
TOOLCHAIN_BIN := $(dir $(CARGO))

export PATH := $(TOOLCHAIN_BIN):$(PATH)
export RUSTC := $(RUSTC)

build:
	$(CARGO) build --release --target wasm32-unknown-unknown

test: build
	$(CARGO) test

deploy: build
	SECRET_KEY="$(SECRET_KEY)" PUBLIC_KEY_HEX="$(PUBLIC_KEY_HEX)" NODE_ADDRESS="$(NODE_ADDRESS)" CHAIN_NAME="$(CHAIN_NAME)" PAYMENT_AMOUNT="$(PAYMENT_AMOUNT)" ./deploy.sh

clean:
	$(CARGO) clean
	rm -f target/wasm32-unknown-unknown/release/*.wasm
