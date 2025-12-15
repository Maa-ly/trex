#![no_std]
#![no_main]

extern crate alloc;

use alloc::{boxed::Box, collections::BTreeMap, format, string::String, vec, vec::Vec};
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    account::AccountHash,
    api_error::ApiError,
    contracts::NamedKeys,
    runtime_args, CLType, CLValue, EntityEntryPoint as EntryPoint, EntryPointAccess,
    EntryPointPayment, EntryPointType, EntryPoints, Key, Parameter, RuntimeArgs, URef, U256,
};

const CONTRACT_NAME: &str = "media_nft_contract";
const CONTRACT_VERSION: &str = "1.0.0";

const MEDIA_ITEMS_KEY: &str = "media_items";
const USER_NFTS_KEY: &str = "user_nfts";
const MEDIA_TO_NFT_KEY: &str = "media_to_nft";
const NFT_COUNTER_KEY: &str = "nft_counter";
const USER_GROUPS_KEY: &str = "user_groups";
const GROUP_MEMBERS_KEY: &str = "group_members";

const ARG_MEDIA_ID: &str = "media_id";
const ARG_MEDIA_TYPE: &str = "media_type";
const ARG_MEDIA_TITLE: &str = "media_title";
const ARG_USER_ADDRESS: &str = "user_address";
const ARG_GROUP_ID: &str = "group_id";
const ARG_GROUP_NAME: &str = "group_name";

#[repr(u8)]
enum MediaType {
    Movie = 1,
    Anime = 2,
    Comic = 3,
    Book = 4,
    Manga = 5,
    Show = 6,
}

#[no_mangle]
pub extern "C" fn call() {
    let entry_points = create_entry_points();
    
    let mut named_keys = NamedKeys::new();
    
    let media_items_uref = storage::new_uref(BTreeMap::<String, (u8, String)>::new());
    named_keys.insert(String::from(MEDIA_ITEMS_KEY), media_items_uref.into());
    runtime::put_key(MEDIA_ITEMS_KEY, media_items_uref.into());
    
    let user_nfts_uref = storage::new_uref(BTreeMap::<Key, Vec<U256>>::new());
    named_keys.insert(String::from(USER_NFTS_KEY), user_nfts_uref.into());
    runtime::put_key(USER_NFTS_KEY, user_nfts_uref.into());
    
    let media_to_nft_uref = storage::new_uref(BTreeMap::<String, U256>::new());
    named_keys.insert(String::from(MEDIA_TO_NFT_KEY), media_to_nft_uref.into());
    runtime::put_key(MEDIA_TO_NFT_KEY, media_to_nft_uref.into());
    
    let nft_counter_uref = storage::new_uref(U256::zero());
    named_keys.insert(String::from(NFT_COUNTER_KEY), nft_counter_uref.into());
    runtime::put_key(NFT_COUNTER_KEY, nft_counter_uref.into());
    
    let user_groups_uref = storage::new_uref(BTreeMap::<Key, Vec<String>>::new());
    named_keys.insert(String::from(USER_GROUPS_KEY), user_groups_uref.into());
    runtime::put_key(USER_GROUPS_KEY, user_groups_uref.into());
    
    let group_members_uref = storage::new_uref(BTreeMap::<String, Vec<Key>>::new());
    named_keys.insert(String::from(GROUP_MEMBERS_KEY), group_members_uref.into());
    runtime::put_key(GROUP_MEMBERS_KEY, group_members_uref.into());
    
    let (contract_hash, _contract_version) = storage::new_contract(
        entry_points,
        Some(named_keys),
        Some(String::from(CONTRACT_NAME)),
        Some(format!("{}_access", CONTRACT_NAME)),
        None,
    );

    runtime::put_key(CONTRACT_NAME, contract_hash.into());
}

fn create_entry_points() -> EntryPoints {
    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "mint_completion_nft",
        vec![
            Parameter::new(ARG_MEDIA_ID, CLType::String),
            Parameter::new(ARG_MEDIA_TYPE, CLType::U8),
            Parameter::new(ARG_MEDIA_TITLE, CLType::String),
        ],
        CLType::U256,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_user_nfts",
        vec![Parameter::new(ARG_USER_ADDRESS, CLType::Key)],
        CLType::List(Box::new(CLType::U256)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "can_user_interact",
        vec![
            Parameter::new("user1", CLType::Key),
            Parameter::new("user2", CLType::Key),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "find_users_with_media",
        vec![Parameter::new(ARG_MEDIA_ID, CLType::String)],
        CLType::List(Box::new(CLType::Key)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "create_group",
        vec![
            Parameter::new(ARG_GROUP_ID, CLType::String),
            Parameter::new(ARG_GROUP_NAME, CLType::String),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "join_group",
        vec![
            Parameter::new(ARG_GROUP_ID, CLType::String),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_group_members",
        vec![Parameter::new(ARG_GROUP_ID, CLType::String)],
        CLType::List(Box::new(CLType::Key)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points
}

#[no_mangle]
pub extern "C" fn mint_completion_nft() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let media_type: u8 = runtime::get_named_arg(ARG_MEDIA_TYPE);
    let media_title: String = runtime::get_named_arg(ARG_MEDIA_TITLE);
    let caller: AccountHash = runtime::get_caller();
    let caller_key = Key::Account(caller);

    let mut nft_counter: U256 = get_nft_counter();
    nft_counter = nft_counter
        .checked_add(U256::from(1))
        .unwrap_or_revert_with(ApiError::User(100));

    let nft_id = nft_counter;

    let mut media_items: BTreeMap<String, (u8, String)> = get_media_items();
    media_items.insert(media_id.clone(), (media_type, media_title.clone()));

    let mut media_to_nft: BTreeMap<String, U256> = get_media_to_nft();
    media_to_nft.insert(media_id.clone(), nft_id);

    let mut user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let user_nft_list = user_nfts.entry(caller_key).or_insert_with(Vec::new);
    user_nft_list.push(nft_id);

    set_media_items(media_items);
    set_media_to_nft(media_to_nft);
    set_user_nfts(user_nfts);
    set_nft_counter(nft_counter);

    runtime::ret(CLValue::from_t(nft_id).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn get_user_nfts() {
    let user_address: Key = runtime::get_named_arg(ARG_USER_ADDRESS);
    let user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let nfts = user_nfts.get(&user_address).cloned().unwrap_or_default();
    runtime::ret(CLValue::from_t(nfts).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn can_user_interact() {
    let user1: Key = runtime::get_named_arg("user1");
    let user2: Key = runtime::get_named_arg("user2");
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);

    let media_to_nft: BTreeMap<String, U256> = get_media_to_nft();
    let required_nft_id = match media_to_nft.get(&media_id) {
        Some(id) => *id,
        None => {
            runtime::ret(CLValue::from_t(false).unwrap_or_revert());
            return;
        }
    };

    let user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let user1_nfts = user_nfts.get(&user1).cloned().unwrap_or_default();
    let user2_nfts = user_nfts.get(&user2).cloned().unwrap_or_default();

    let can_interact = user1_nfts.contains(&required_nft_id) && user2_nfts.contains(&required_nft_id);
    runtime::ret(CLValue::from_t(can_interact).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn find_users_with_media() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let media_to_nft: BTreeMap<String, U256> = get_media_to_nft();
    let required_nft_id = match media_to_nft.get(&media_id) {
        Some(id) => *id,
        None => {
            runtime::ret(CLValue::from_t(Vec::<Key>::new()).unwrap_or_revert());
        }
    };

    let user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let mut users_with_media = Vec::new();

    for (user, nfts) in user_nfts.iter() {
        if nfts.contains(&required_nft_id) {
            users_with_media.push(*user);
        }
    }

    runtime::ret(CLValue::from_t(users_with_media).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn create_group() {
    let group_id: String = runtime::get_named_arg(ARG_GROUP_ID);
    let _group_name: String = runtime::get_named_arg(ARG_GROUP_NAME);
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let creator: AccountHash = runtime::get_caller();
    let creator_key = Key::Account(creator);

    let media_to_nft: BTreeMap<String, U256> = get_media_to_nft();
    let required_nft_id = match media_to_nft.get(&media_id) {
        Some(id) => *id,
        None => {
            runtime::revert(ApiError::User(101));
        }
    };

    let user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let creator_nfts = user_nfts.get(&creator_key).cloned().unwrap_or_default();
    if !creator_nfts.contains(&required_nft_id) {
        runtime::revert(ApiError::User(102));
    }

    let mut group_members: BTreeMap<String, Vec<Key>> = get_group_members_map();
    if group_members.contains_key(&group_id) {
        runtime::revert(ApiError::User(103));
    }

    let mut members = Vec::new();
    members.push(creator_key);
    group_members.insert(group_id.clone(), members);

    let mut user_groups: BTreeMap<Key, Vec<String>> = get_user_groups();
    let user_group_list = user_groups.entry(creator_key).or_insert_with(Vec::new);
    user_group_list.push(group_id.clone());

    set_group_members(group_members);
    set_user_groups(user_groups);
}

#[no_mangle]
pub extern "C" fn join_group() {
    let group_id: String = runtime::get_named_arg(ARG_GROUP_ID);
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let joiner: AccountHash = runtime::get_caller();
    let joiner_key = Key::Account(joiner);

    let media_to_nft: BTreeMap<String, U256> = get_media_to_nft();
    let required_nft_id = match media_to_nft.get(&media_id) {
        Some(id) => *id,
        None => {
            runtime::revert(ApiError::User(101));
        }
    };

    let user_nfts: BTreeMap<Key, Vec<U256>> = get_user_nfts_map();
    let joiner_nfts = user_nfts.get(&joiner_key).cloned().unwrap_or_default();
    if !joiner_nfts.contains(&required_nft_id) {
        runtime::revert(ApiError::User(102));
    }

    let mut group_members: BTreeMap<String, Vec<Key>> = get_group_members_map();
    let members = match group_members.get_mut(&group_id) {
        Some(m) => m,
        None => {
            runtime::revert(ApiError::User(104));
        }
    };

    if members.contains(&joiner_key) {
        runtime::revert(ApiError::User(105));
    }

    members.push(joiner_key);

    let mut user_groups: BTreeMap<Key, Vec<String>> = get_user_groups();
    let user_group_list = user_groups.entry(joiner_key).or_insert_with(Vec::new);
    user_group_list.push(group_id.clone());

    set_group_members(group_members);
    set_user_groups(user_groups);
}

#[no_mangle]
pub extern "C" fn get_group_members() {
    let group_id: String = runtime::get_named_arg(ARG_GROUP_ID);
    let group_members: BTreeMap<String, Vec<Key>> = get_group_members_map();
    let members = group_members.get(&group_id).cloned().unwrap_or_default();
    runtime::ret(CLValue::from_t(members).unwrap_or_revert());
}

fn get_uref(key: &str) -> URef {
    runtime::get_key(key)
        .and_then(Key::into_uref)
        .unwrap_or_revert_with(ApiError::MissingKey)
}

fn get_media_items() -> BTreeMap<String, (u8, String)> {
    storage::read(get_uref(MEDIA_ITEMS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_media_items(media_items: BTreeMap<String, (u8, String)>) {
    storage::write(get_uref(MEDIA_ITEMS_KEY), media_items);
}

fn get_user_nfts_map() -> BTreeMap<Key, Vec<U256>> {
    storage::read(get_uref(USER_NFTS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_user_nfts(user_nfts: BTreeMap<Key, Vec<U256>>) {
    storage::write(get_uref(USER_NFTS_KEY), user_nfts);
}

fn get_media_to_nft() -> BTreeMap<String, U256> {
    storage::read(get_uref(MEDIA_TO_NFT_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_media_to_nft(media_to_nft: BTreeMap<String, U256>) {
    storage::write(get_uref(MEDIA_TO_NFT_KEY), media_to_nft);
}

fn get_nft_counter() -> U256 {
    storage::read(get_uref(NFT_COUNTER_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or(U256::zero())
}

fn set_nft_counter(counter: U256) {
    storage::write(get_uref(NFT_COUNTER_KEY), counter);
}

fn get_user_groups() -> BTreeMap<Key, Vec<String>> {
    storage::read(get_uref(USER_GROUPS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_user_groups(user_groups: BTreeMap<Key, Vec<String>>) {
    storage::write(get_uref(USER_GROUPS_KEY), user_groups);
}

fn get_group_members_map() -> BTreeMap<String, Vec<Key>> {
    storage::read(get_uref(GROUP_MEMBERS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_group_members(group_members: BTreeMap<String, Vec<Key>>) {
    storage::write(get_uref(GROUP_MEMBERS_KEY), group_members);
}

