#[cfg(test)]
mod tests {
    use casper_engine_test_support::{
        ExecuteRequestBuilder, LmdbWasmTestBuilder, DEFAULT_ACCOUNT_ADDR,
        LOCAL_GENESIS_REQUEST,
    };
    use casper_types::{contracts::ContractHash, runtime_args};

    const CONTRACT_NAME: &str = "media_nft_contract";
    const WASM_FILE: &str = "media-nft-contract.wasm";

    #[test]
    fn should_install_contract() {
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request = ExecuteRequestBuilder::standard(
            *DEFAULT_ACCOUNT_ADDR,
            WASM_FILE,
            runtime_args! {},
        )
        .build();

        builder.exec(install_request).expect_success().commit();
    }

    #[test]
    fn should_mint_nft_on_completion() {
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request = ExecuteRequestBuilder::standard(
            *DEFAULT_ACCOUNT_ADDR,
            WASM_FILE,
            runtime_args! {},
        )
        .build();

        builder.exec(install_request).expect_success().commit();

        let mint_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "mint_completion_nft",
            runtime_args! {
                "media_id" => "one-piece-001",
                "media_type" => 2u8,
                "media_title" => "One Piece",
            },
        )
        .build();

        builder.exec(mint_request).expect_success().commit();
    }

    #[test]
    fn should_allow_interaction_when_both_have_nft() {
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request = ExecuteRequestBuilder::standard(
            *DEFAULT_ACCOUNT_ADDR,
            WASM_FILE,
            runtime_args! {},
        )
        .build();

        builder.exec(install_request).expect_success().commit();

        let media_id = "game-of-thrones-001";
        let media_type = 6u8;
        let media_title = "Game of Thrones";

        let mint_request1 = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "mint_completion_nft",
            runtime_args! {
                "media_id" => media_id,
                "media_type" => media_type,
                "media_title" => media_title,
            },
        )
        .build();

        builder.exec(mint_request1).expect_success().commit();

        let can_interact_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "can_user_interact",
            runtime_args! {
                "user1" => *DEFAULT_ACCOUNT_ADDR,
                "user2" => *DEFAULT_ACCOUNT_ADDR,
                "media_id" => media_id,
            },
        )
        .build();

        builder.exec(can_interact_request).expect_success().commit();
    }

    #[test]
    fn should_create_group() {
        let mut builder = LmdbWasmTestBuilder::default();
        builder.run_genesis(LOCAL_GENESIS_REQUEST.clone());

        let install_request = ExecuteRequestBuilder::standard(
            *DEFAULT_ACCOUNT_ADDR,
            WASM_FILE,
            runtime_args! {},
        )
        .build();

        builder.exec(install_request).expect_success().commit();

        let media_id = "calculus-book-001";
        let media_type = 4u8;
        let media_title = "Calculus Made Easy";

        let mint_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "mint_completion_nft",
            runtime_args! {
                "media_id" => media_id,
                "media_type" => media_type,
                "media_title" => media_title,
            },
        )
        .build();

        builder.exec(mint_request).expect_success().commit();

        let create_group_request = ExecuteRequestBuilder::contract_call_by_hash(
            *DEFAULT_ACCOUNT_ADDR,
            get_contract_hash(&builder).into(),
            "create_group",
            runtime_args! {
                "group_id" => "calculus-study-group",
                "group_name" => "Calculus Study Group",
                "media_id" => media_id,
            },
        )
        .build();

        builder.exec(create_group_request).expect_success().commit();
    }

    fn get_contract_hash(builder: &LmdbWasmTestBuilder) -> ContractHash {
        builder
            .get_account(*DEFAULT_ACCOUNT_ADDR)
            .expect("should have account")
            .named_keys()
            .get(CONTRACT_NAME)
            .and_then(|key| key.into_hash_addr())
            .map(|hash| ContractHash::new(hash.into()))
            .expect("should have contract hash")
    }
}

