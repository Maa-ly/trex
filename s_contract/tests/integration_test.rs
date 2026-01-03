#[cfg(test)]
mod tests {
    use blake2::digest::{Update, VariableOutput};
    use casper_engine_test_support::{
        ExecuteRequestBuilder, LmdbWasmTestBuilder, DEFAULT_ACCOUNT_ADDR, LOCAL_GENESIS_REQUEST,
    };
    use casper_types::{contracts::ContractHash, runtime_args, Key};

    const CONTRACT_NAME: &str = "media_nft_contract";
    const WASM_FILE: &str = "target/wasm32-unknown-unknown/release/media_nft_contract.wasm";

    #[test]
    fn should_install_contract() {
        std::fs::create_dir_all("wasm").unwrap();
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request =
            ExecuteRequestBuilder::standard(*DEFAULT_ACCOUNT_ADDR, WASM_FILE, runtime_args! {})
                .build();

        builder.exec(install_request).expect_success().commit();
    }

    #[test]
    fn should_mint_nft_on_completion() {
        std::fs::create_dir_all("wasm").unwrap();
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request =
            ExecuteRequestBuilder::standard(*DEFAULT_ACCOUNT_ADDR, WASM_FILE, runtime_args! {})
                .build();

        builder.exec(install_request).expect_success().commit();

        let complete_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "complete_and_register_by_external_id",
            runtime_args! {
                "to" => Key::Account(*DEFAULT_ACCOUNT_ADDR),
                "kind" => 2u8,
                "uri" => "https://example.com/one-piece",
                "name" => "One Piece",
            },
        )
        .build();

        builder.exec(complete_request).expect_success().commit();
    }

    #[test]
    fn should_allow_interaction_when_both_have_nft() {
        std::fs::create_dir_all("wasm").unwrap();
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request =
            ExecuteRequestBuilder::standard(*DEFAULT_ACCOUNT_ADDR, WASM_FILE, runtime_args! {})
                .build();

        builder.exec(install_request).expect_success().commit();

        let kind = 6u8;
        let uri = "https://example.com/game-of-thrones";
        let name = "Game of Thrones";
        let media_id = media_id_hex(kind, uri, name);

        let complete_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "complete_and_register_by_external_id",
            runtime_args! {
                "to" => Key::Account(*DEFAULT_ACCOUNT_ADDR),
                "kind" => kind,
                "uri" => uri,
                "name" => name,
            },
        )
        .build();

        builder.exec(complete_request).expect_success().commit();

        let can_text_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "can_text",
            runtime_args! {
                "from" => Key::Account(*DEFAULT_ACCOUNT_ADDR),
                "to" => Key::Account(*DEFAULT_ACCOUNT_ADDR),
                "media_id" => media_id,
            },
        )
        .build();

        builder.exec(can_text_request).expect_success().commit();
    }

    #[test]
    fn should_join_group_after_completion() {
        std::fs::create_dir_all("wasm").unwrap();
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request =
            ExecuteRequestBuilder::standard(*DEFAULT_ACCOUNT_ADDR, WASM_FILE, runtime_args! {})
                .build();

        builder.exec(install_request).expect_success().commit();

        let kind = 4u8;
        let uri = "https://example.com/calculus-made-easy";
        let name = "Calculus Made Easy";
        let media_id = media_id_hex(kind, uri, name);

        let complete_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "complete_and_register_by_external_id",
            runtime_args! {
                "to" => Key::Account(*DEFAULT_ACCOUNT_ADDR),
                "kind" => kind,
                "uri" => uri,
                "name" => name,
            },
        )
        .build();

        builder.exec(complete_request).expect_success().commit();

        let join_group_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "join_group",
            runtime_args! {
                "media_id" => media_id,
            },
        )
        .build();

        builder.exec(join_group_request).expect_success().commit();
    }

    fn media_id_hex(kind: u8, uri: &str, name: &str) -> String {
        let mut bytes = Vec::new();
        bytes.push(kind);
        bytes.extend_from_slice(uri.as_bytes());
        bytes.push(0);
        bytes.extend_from_slice(name.as_bytes());

        let mut digest = vec![0u8; 32];
        let mut hasher = blake2::Blake2bVar::new(32).unwrap();
        hasher.update(&bytes);
        hasher.finalize_variable(&mut digest).unwrap();
        let mut out = String::with_capacity(64);
        for b in digest.iter() {
            out.push_str(&format!("{:02x}", b));
        }
        out
    }

    fn get_contract_hash(builder: &LmdbWasmTestBuilder) -> ContractHash {
        builder
            .get_account(*DEFAULT_ACCOUNT_ADDR)
            .expect("should have account")
            .named_keys()
            .get(CONTRACT_NAME)
            .and_then(|key| key.into_hash_addr())
            .map(ContractHash::new)
            .expect("should have contract hash")
    }
}
