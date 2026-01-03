use alloc::{
    boxed::Box,
    collections::{BTreeMap, BTreeSet},
    format,
    string::String,
    vec,
    vec::Vec,
};
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    account::AccountHash,
    api_error::ApiError,
    contracts::NamedKeys,
    CLType, CLValue, EntityEntryPoint as EntryPoint, EntryPointAccess, EntryPointPayment,
    EntryPointType, EntryPoints, Key, Parameter, URef, U256,
};

const CONTRACT_NAME: &str = "media_nft_contract";

const OWNER_KEY: &str = "owner";
const BACKEND_KEY: &str = "backend";
const BASE_URI_KEY: &str = "base_uri";
const NEXT_TOKEN_ID_KEY: &str = "next_token_id";

const MEDIA_KEY: &str = "media";
const TOKEN_OWNER_KEY: &str = "token_owner";
const TOKEN_MEDIA_ID_KEY: &str = "token_media_id";
const COMPLETION_TOKEN_ID_KEY: &str = "completion_token_id";

const USER_TOKEN_IDS_KEY: &str = "user_token_ids";
const USER_TOKEN_INDEX_PLUS_ONE_KEY: &str = "user_token_index_plus_one";

const MEDIA_COMPLETERS_KEY: &str = "media_completers";
const MEDIA_COMPLETER_INDEX_PLUS_ONE_KEY: &str = "media_completer_index_plus_one";

const GROUP_MEMBERS_KEY: &str = "group_members";
const GROUP_INDEX_PLUS_ONE_KEY: &str = "group_index_plus_one";

const REGISTRAR_KEY: &str = "registrar";

const ARG_TO: &str = "to";
const ARG_KIND: &str = "kind";
const ARG_URI: &str = "uri";
const ARG_NAME: &str = "name";
const ARG_MEDIA_ID: &str = "media_id";
const ARG_USER: &str = "user";
const ARG_FROM: &str = "from";
const ARG_TOKEN_ID: &str = "token_id";
const ARG_TOKEN_IDS: &str = "token_ids";
const ARG_INDEX: &str = "index";
const ARG_BASE_URI: &str = "base_uri";
const ARG_REGISTRAR: &str = "registrar";
const ARG_ALLOWED: &str = "allowed";
const ARG_BACKEND: &str = "backend";

#[no_mangle]
pub extern "C" fn call() {
    let entry_points = create_entry_points();

    let caller = runtime::get_caller();
    let owner_uref = storage::new_uref(caller);
    let backend_uref = storage::new_uref(Key::Account(caller));
    let base_uri_uref = storage::new_uref(String::new());
    let next_token_id_uref = storage::new_uref(U256::one());

    let mut named_keys = NamedKeys::new();
    named_keys.insert(String::from(OWNER_KEY), owner_uref.into());
    named_keys.insert(String::from(BACKEND_KEY), backend_uref.into());
    named_keys.insert(String::from(BASE_URI_KEY), base_uri_uref.into());
    named_keys.insert(String::from(NEXT_TOKEN_ID_KEY), next_token_id_uref.into());

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
        "compute_media_id",
        vec![
            Parameter::new(ARG_KIND, CLType::U8),
            Parameter::new(ARG_URI, CLType::String),
            Parameter::new(ARG_NAME, CLType::String),
        ],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "set_registrar",
        vec![
            Parameter::new(ARG_REGISTRAR, CLType::Key),
            Parameter::new(ARG_ALLOWED, CLType::Bool),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "set_backend",
        vec![Parameter::new(ARG_BACKEND, CLType::Key)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "complete_and_register_by_external_id",
        vec![
            Parameter::new(ARG_TO, CLType::Key),
            Parameter::new(ARG_KIND, CLType::U8),
            Parameter::new(ARG_URI, CLType::String),
            Parameter::new(ARG_NAME, CLType::String),
        ],
        CLType::U256,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "set_media_uri",
        vec![
            Parameter::new(ARG_MEDIA_ID, CLType::String),
            Parameter::new(ARG_URI, CLType::String),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "set_media_kind",
        vec![
            Parameter::new(ARG_MEDIA_ID, CLType::String),
            Parameter::new(ARG_KIND, CLType::U8),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "media_info",
        vec![Parameter::new(ARG_MEDIA_ID, CLType::String)],
        CLType::Tuple3([
            Box::new(CLType::Bool),
            Box::new(CLType::U8),
            Box::new(CLType::Tuple2([Box::new(CLType::String), Box::new(CLType::String)])),
        ]),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "has_completed",
        vec![
            Parameter::new(ARG_USER, CLType::Key),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "user_token_ids",
        vec![Parameter::new(ARG_USER, CLType::Key)],
        CLType::List(Box::new(CLType::U256)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "can_text",
        vec![
            Parameter::new(ARG_FROM, CLType::Key),
            Parameter::new(ARG_TO, CLType::Key),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "can_join_group",
        vec![
            Parameter::new(ARG_USER, CLType::Key),
            Parameter::new(ARG_MEDIA_ID, CLType::String),
        ],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "join_group",
        vec![Parameter::new(ARG_MEDIA_ID, CLType::String)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "leave_group",
        vec![Parameter::new(ARG_MEDIA_ID, CLType::String)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "is_group_member",
        vec![
            Parameter::new(ARG_MEDIA_ID, CLType::String),
            Parameter::new(ARG_USER, CLType::Key),
        ],
        CLType::Bool,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "group_member_count",
        vec![Parameter::new(ARG_MEDIA_ID, CLType::String)],
        CLType::U256,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "group_member_at",
        vec![
            Parameter::new(ARG_MEDIA_ID, CLType::String),
            Parameter::new(ARG_INDEX, CLType::U256),
        ],
        CLType::Key,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "burn",
        vec![Parameter::new(ARG_TOKEN_ID, CLType::U256)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "set_base_uri",
        vec![Parameter::new(ARG_BASE_URI, CLType::String)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "owner_of",
        vec![Parameter::new(ARG_TOKEN_ID, CLType::U256)],
        CLType::Key,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "token_uri",
        vec![Parameter::new(ARG_TOKEN_ID, CLType::U256)],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_similars_from_tokens",
        vec![Parameter::new(ARG_TOKEN_IDS, CLType::List(Box::new(CLType::U256)))],
        CLType::List(Box::new(CLType::Key)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_similars_for_token",
        vec![Parameter::new(ARG_TOKEN_ID, CLType::U256)],
        CLType::List(Box::new(CLType::Key)),
        EntryPointAccess::Public,
        EntryPointType::Called,
        EntryPointPayment::Caller,
    ));

    entry_points
}

fn get_uref(key: &str) -> URef {
    runtime::get_key(key)
        .and_then(Key::into_uref)
        .unwrap_or_revert_with(ApiError::MissingKey)
}

fn get_or_init_uref<T: Default>(key: &str) -> URef
where
    T: casper_types::bytesrepr::FromBytes + casper_types::bytesrepr::ToBytes + casper_types::CLTyped,
{
    if let Some(uref) = runtime::get_key(key).and_then(Key::into_uref) {
        return uref;
    }
    let uref = storage::new_uref(T::default());
    runtime::put_key(key, uref.into());
    uref
}

fn require_owner() {
    let owner: AccountHash = storage::read(get_uref(OWNER_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_revert();
    if runtime::get_caller() != owner {
        runtime::revert(ApiError::User(1));
    }
}

fn require_backend() {
    let backend: Key = storage::read(get_uref(BACKEND_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_revert();
    let caller = Key::Account(runtime::get_caller());
    if caller != backend {
        runtime::revert(ApiError::User(2));
    }
}

fn get_next_token_id() -> U256 {
    storage::read(get_uref(NEXT_TOKEN_ID_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or(U256::one())
}

fn set_next_token_id(v: U256) {
    storage::write(get_uref(NEXT_TOKEN_ID_KEY), v);
}

fn get_media() -> BTreeMap<String, (u8, bool, (String, String))> {
    storage::read(get_or_init_uref::<BTreeMap<String, (u8, bool, (String, String))>>(MEDIA_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_media(v: BTreeMap<String, (u8, bool, (String, String))>) {
    storage::write(get_or_init_uref::<BTreeMap<String, (u8, bool, (String, String))>>(MEDIA_KEY), v);
}

fn get_token_owner() -> BTreeMap<U256, Key> {
    storage::read(get_or_init_uref::<BTreeMap<U256, Key>>(TOKEN_OWNER_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_token_owner(v: BTreeMap<U256, Key>) {
    storage::write(get_or_init_uref::<BTreeMap<U256, Key>>(TOKEN_OWNER_KEY), v);
}

fn get_token_media_id() -> BTreeMap<U256, String> {
    storage::read(get_or_init_uref::<BTreeMap<U256, String>>(TOKEN_MEDIA_ID_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_token_media_id(v: BTreeMap<U256, String>) {
    storage::write(get_or_init_uref::<BTreeMap<U256, String>>(TOKEN_MEDIA_ID_KEY), v);
}

fn get_completion_token_id() -> BTreeMap<(Key, String), U256> {
    storage::read(get_or_init_uref::<BTreeMap<(Key, String), U256>>(COMPLETION_TOKEN_ID_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_completion_token_id(v: BTreeMap<(Key, String), U256>) {
    storage::write(get_or_init_uref::<BTreeMap<(Key, String), U256>>(COMPLETION_TOKEN_ID_KEY), v);
}

fn get_user_token_ids() -> BTreeMap<Key, Vec<U256>> {
    storage::read(get_or_init_uref::<BTreeMap<Key, Vec<U256>>>(USER_TOKEN_IDS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_user_token_ids(v: BTreeMap<Key, Vec<U256>>) {
    storage::write(get_or_init_uref::<BTreeMap<Key, Vec<U256>>>(USER_TOKEN_IDS_KEY), v);
}

fn get_user_token_index_plus_one() -> BTreeMap<(Key, U256), U256> {
    storage::read(get_or_init_uref::<BTreeMap<(Key, U256), U256>>(USER_TOKEN_INDEX_PLUS_ONE_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_user_token_index_plus_one(v: BTreeMap<(Key, U256), U256>) {
    storage::write(get_or_init_uref::<BTreeMap<(Key, U256), U256>>(USER_TOKEN_INDEX_PLUS_ONE_KEY), v);
}

fn get_media_completers() -> BTreeMap<String, Vec<Key>> {
    storage::read(get_or_init_uref::<BTreeMap<String, Vec<Key>>>(MEDIA_COMPLETERS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_media_completers(v: BTreeMap<String, Vec<Key>>) {
    storage::write(get_or_init_uref::<BTreeMap<String, Vec<Key>>>(MEDIA_COMPLETERS_KEY), v);
}

fn get_media_completer_index_plus_one() -> BTreeMap<(String, Key), U256> {
    storage::read(
        get_or_init_uref::<BTreeMap<(String, Key), U256>>(MEDIA_COMPLETER_INDEX_PLUS_ONE_KEY),
    )
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_media_completer_index_plus_one(v: BTreeMap<(String, Key), U256>) {
    storage::write(
        get_or_init_uref::<BTreeMap<(String, Key), U256>>(MEDIA_COMPLETER_INDEX_PLUS_ONE_KEY),
        v,
    );
}

fn get_group_members_map() -> BTreeMap<String, Vec<Key>> {
    storage::read(get_or_init_uref::<BTreeMap<String, Vec<Key>>>(GROUP_MEMBERS_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_group_members_map(v: BTreeMap<String, Vec<Key>>) {
    storage::write(get_or_init_uref::<BTreeMap<String, Vec<Key>>>(GROUP_MEMBERS_KEY), v);
}

fn get_group_index_plus_one() -> BTreeMap<(String, Key), U256> {
    storage::read(get_or_init_uref::<BTreeMap<(String, Key), U256>>(GROUP_INDEX_PLUS_ONE_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_group_index_plus_one(v: BTreeMap<(String, Key), U256>) {
    storage::write(get_or_init_uref::<BTreeMap<(String, Key), U256>>(GROUP_INDEX_PLUS_ONE_KEY), v);
}

fn get_base_uri() -> String {
    storage::read(get_uref(BASE_URI_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default()
}

fn set_base_uri_internal(v: String) {
    storage::write(get_uref(BASE_URI_KEY), v);
}

fn media_id_hex(kind: u8, uri: &str, name: &str) -> String {
    let mut bytes = Vec::new();
    bytes.push(kind);
    bytes.extend_from_slice(uri.as_bytes());
    bytes.push(0);
    bytes.extend_from_slice(name.as_bytes());
    let digest = runtime::blake2b(bytes);
    let mut out = String::with_capacity(64);
    for b in digest.iter() {
        out.push_str(&hex_byte(*b));
    }
    out
}

fn hex_byte(b: u8) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(2);
    s.push(HEX[(b >> 4) as usize] as char);
    s.push(HEX[(b & 0x0f) as usize] as char);
    s
}

fn require_token_owner(token_id: U256, user: Key) {
    let token_owner = get_token_owner();
    match token_owner.get(&token_id) {
        Some(owner) if *owner == user => {}
        _ => runtime::revert(ApiError::User(3)),
    }
}

fn add_media_completer(user: Key, media_id: String) {
    let mut media_completers = get_media_completers();
    let mut index_map = get_media_completer_index_plus_one();

    let key = (media_id.clone(), user);
    if index_map.get(&key).copied().unwrap_or(U256::zero()) != U256::zero() {
        return;
    }

    let list = media_completers.entry(media_id.clone()).or_insert_with(Vec::new);
    list.push(user);
    index_map.insert(key, U256::from(list.len() as u64));

    set_media_completers(media_completers);
    set_media_completer_index_plus_one(index_map);
}

fn remove_media_completer(user: Key, media_id: String) {
    let mut media_completers = get_media_completers();
    let mut index_map = get_media_completer_index_plus_one();

    let key = (media_id.clone(), user);
    let index_plus_one = index_map.get(&key).copied().unwrap_or(U256::zero());
    if index_plus_one == U256::zero() {
        return;
    }

    let list = media_completers.entry(media_id.clone()).or_insert_with(Vec::new);
    let idx = (index_plus_one.as_u64() as usize).saturating_sub(1);
    let last_idx = list.len().saturating_sub(1);

    if idx < list.len() {
        if idx != last_idx {
            let last = list[last_idx];
            list[idx] = last;
            index_map.insert((media_id.clone(), last), U256::from(idx as u64 + 1));
        }
        list.pop();
    }

    index_map.remove(&key);

    set_media_completers(media_completers);
    set_media_completer_index_plus_one(index_map);
}

fn join_group_internal(user: Key, media_id: String) {
    let mut group_members = get_group_members_map();
    let mut group_index = get_group_index_plus_one();

    let key = (media_id.clone(), user);
    if group_index.get(&key).copied().unwrap_or(U256::zero()) != U256::zero() {
        return;
    }

    let list = group_members.entry(media_id.clone()).or_insert_with(Vec::new);
    list.push(user);
    group_index.insert(key, U256::from(list.len() as u64));

    set_group_members_map(group_members);
    set_group_index_plus_one(group_index);
}

fn remove_group_member_internal(user: Key, media_id: String) {
    let mut group_members = get_group_members_map();
    let mut group_index = get_group_index_plus_one();

    let key = (media_id.clone(), user);
    let index_plus_one = group_index.get(&key).copied().unwrap_or(U256::zero());
    if index_plus_one == U256::zero() {
        return;
    }

    let list = group_members.entry(media_id.clone()).or_insert_with(Vec::new);
    let idx = (index_plus_one.as_u64() as usize).saturating_sub(1);
    let last_idx = list.len().saturating_sub(1);

    if idx < list.len() {
        if idx != last_idx {
            let last = list[last_idx];
            list[idx] = last;
            group_index.insert((media_id.clone(), last), U256::from(idx as u64 + 1));
        }
        list.pop();
    }

    group_index.remove(&key);

    set_group_members_map(group_members);
    set_group_index_plus_one(group_index);
}

fn remove_user_token_id(user: Key, token_id: U256) {
    let mut user_token_ids = get_user_token_ids();
    let mut index_map = get_user_token_index_plus_one();

    let key = (user, token_id);
    let index_plus_one = index_map.get(&key).copied().unwrap_or(U256::zero());
    if index_plus_one == U256::zero() {
        return;
    }

    let list = user_token_ids.entry(user).or_insert_with(Vec::new);
    let idx = (index_plus_one.as_u64() as usize).saturating_sub(1);
    let last_idx = list.len().saturating_sub(1);

    if idx < list.len() {
        if idx != last_idx {
            let last = list[last_idx];
            list[idx] = last;
            index_map.insert((user, last), U256::from(idx as u64 + 1));
        }
        list.pop();
    }

    index_map.remove(&key);

    set_user_token_ids(user_token_ids);
    set_user_token_index_plus_one(index_map);
}

fn complete_internal(user: Key, media_id: String) -> U256 {
    let mut completion = get_completion_token_id();
    if completion
        .get(&(user, media_id.clone()))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero()
    {
        runtime::revert(ApiError::User(4));
    }

    let token_id = get_next_token_id();
    set_next_token_id(token_id + U256::one());

    let mut token_owner = get_token_owner();
    let mut token_media = get_token_media_id();
    token_owner.insert(token_id, user);
    token_media.insert(token_id, media_id.clone());
    set_token_owner(token_owner);
    set_token_media_id(token_media);

    completion.insert((user, media_id.clone()), token_id);
    set_completion_token_id(completion);

    let mut user_tokens = get_user_token_ids();
    let mut user_index = get_user_token_index_plus_one();
    let list = user_tokens.entry(user).or_insert_with(Vec::new);
    list.push(token_id);
    user_index.insert((user, token_id), U256::from(list.len() as u64));
    set_user_token_ids(user_tokens);
    set_user_token_index_plus_one(user_index);

    add_media_completer(user, media_id);

    token_id
}

#[no_mangle]
pub extern "C" fn compute_media_id() {
    let kind: u8 = runtime::get_named_arg(ARG_KIND);
    let uri: String = runtime::get_named_arg(ARG_URI);
    let name: String = runtime::get_named_arg(ARG_NAME);
    let media_id = media_id_hex(kind, &uri, &name);
    runtime::ret(CLValue::from_t(media_id).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn set_registrar() {
    require_owner();
    let registrar: Key = runtime::get_named_arg(ARG_REGISTRAR);
    let allowed: bool = runtime::get_named_arg(ARG_ALLOWED);
    let mut registrars: BTreeMap<Key, bool> =
        storage::read(get_or_init_uref::<BTreeMap<Key, bool>>(REGISTRAR_KEY))
        .unwrap_or_revert_with(ApiError::Read)
        .unwrap_or_default();
    registrars.insert(registrar, allowed);
    storage::write(
        get_or_init_uref::<BTreeMap<Key, bool>>(REGISTRAR_KEY),
        registrars,
    );
}

#[no_mangle]
pub extern "C" fn set_backend() {
    require_owner();
    let backend: Key = runtime::get_named_arg(ARG_BACKEND);
    storage::write(get_uref(BACKEND_KEY), backend);
}

#[no_mangle]
pub extern "C" fn complete_and_register_by_external_id() {
    require_backend();
    let to: Key = runtime::get_named_arg(ARG_TO);
    let kind: u8 = runtime::get_named_arg(ARG_KIND);
    let uri: String = runtime::get_named_arg(ARG_URI);
    let name: String = runtime::get_named_arg(ARG_NAME);

    let media_id = media_id_hex(kind, &uri, &name);

    let mut media = get_media();
    let exists = media.get(&media_id).map(|v| v.1).unwrap_or(false);
    if !exists {
        media.insert(media_id.clone(), (kind, true, (uri, name)));
        set_media(media);
    }

    let token_id = complete_internal(to, media_id);
    runtime::ret(CLValue::from_t(token_id).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn set_media_uri() {
    require_owner();
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let uri: String = runtime::get_named_arg(ARG_URI);
    let mut media = get_media();
    let item = match media.get_mut(&media_id) {
        Some(v) if v.1 => v,
        _ => runtime::revert(ApiError::User(5)),
    };
    item.2.0 = uri;
    set_media(media);
}

#[no_mangle]
pub extern "C" fn set_media_kind() {
    require_owner();
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let kind: u8 = runtime::get_named_arg(ARG_KIND);
    let mut media = get_media();
    let item = match media.get_mut(&media_id) {
        Some(v) if v.1 => v,
        _ => runtime::revert(ApiError::User(5)),
    };
    item.0 = kind;
    set_media(media);
}

#[no_mangle]
pub extern "C" fn media_info() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let media = get_media();
    let (kind, exists, (uri, name)) = media
        .get(&media_id)
        .cloned()
        .unwrap_or((0u8, false, (String::new(), String::new())));
    runtime::ret(CLValue::from_t((exists, kind, (uri, name))).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn has_completed() {
    let user: Key = runtime::get_named_arg(ARG_USER);
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let completion = get_completion_token_id();
    let has = completion
        .get(&(user, media_id))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    runtime::ret(CLValue::from_t(has).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn user_token_ids() {
    let user: Key = runtime::get_named_arg(ARG_USER);
    let user_tokens = get_user_token_ids();
    let tokens = user_tokens.get(&user).cloned().unwrap_or_default();
    runtime::ret(CLValue::from_t(tokens).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn can_text() {
    let from: Key = runtime::get_named_arg(ARG_FROM);
    let to: Key = runtime::get_named_arg(ARG_TO);
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let completion = get_completion_token_id();
    let from_ok = completion
        .get(&(from, media_id.clone()))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    let to_ok = completion
        .get(&(to, media_id))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    runtime::ret(CLValue::from_t(from_ok && to_ok).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn can_join_group() {
    let user: Key = runtime::get_named_arg(ARG_USER);
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let completion = get_completion_token_id();
    let has = completion
        .get(&(user, media_id.clone()))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    let group_index = get_group_index_plus_one();
    let in_group = group_index
        .get(&(media_id, user))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    runtime::ret(CLValue::from_t(has && !in_group).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn join_group() {
    let caller = Key::Account(runtime::get_caller());
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let completion = get_completion_token_id();
    let has = completion
        .get(&(caller, media_id.clone()))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    if !has {
        runtime::revert(ApiError::User(6));
    }
    join_group_internal(caller, media_id);
}

#[no_mangle]
pub extern "C" fn leave_group() {
    let caller = Key::Account(runtime::get_caller());
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let group_index = get_group_index_plus_one();
    let in_group = group_index
        .get(&(media_id.clone(), caller))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    if !in_group {
        runtime::revert(ApiError::User(7));
    }
    remove_group_member_internal(caller, media_id);
}

#[no_mangle]
pub extern "C" fn is_group_member() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let user: Key = runtime::get_named_arg(ARG_USER);
    let group_index = get_group_index_plus_one();
    let in_group = group_index
        .get(&(media_id, user))
        .copied()
        .unwrap_or(U256::zero())
        != U256::zero();
    runtime::ret(CLValue::from_t(in_group).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn group_member_count() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let group_members = get_group_members_map();
    let count = group_members
        .get(&media_id)
        .map(|v| U256::from(v.len() as u64))
        .unwrap_or(U256::zero());
    runtime::ret(CLValue::from_t(count).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn group_member_at() {
    let media_id: String = runtime::get_named_arg(ARG_MEDIA_ID);
    let index: U256 = runtime::get_named_arg(ARG_INDEX);
    let idx = index.as_u64() as usize;
    let group_members = get_group_members_map();
    let list = group_members.get(&media_id).cloned().unwrap_or_default();
    if idx >= list.len() {
        runtime::revert(ApiError::User(8));
    }
    runtime::ret(CLValue::from_t(list[idx]).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn owner_of() {
    let token_id: U256 = runtime::get_named_arg(ARG_TOKEN_ID);
    let token_owner = get_token_owner();
    let owner = token_owner.get(&token_id).copied().unwrap_or_revert();
    runtime::ret(CLValue::from_t(owner).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn token_uri() {
    let token_id: U256 = runtime::get_named_arg(ARG_TOKEN_ID);
    let token_owner = get_token_owner();
    if token_owner.get(&token_id).is_none() {
        runtime::revert(ApiError::User(9));
    }
    let token_media = get_token_media_id();
    let media_id = token_media.get(&token_id).cloned().unwrap_or_default();
    let media = get_media();
    let uri = media.get(&media_id).map(|v| v.2.0.clone()).unwrap_or_default();
    if !uri.is_empty() {
        runtime::ret(CLValue::from_t(uri).unwrap_or_revert());
    }
    let base = get_base_uri();
    if base.is_empty() {
        runtime::ret(CLValue::from_t(String::new()).unwrap_or_revert());
    }
    runtime::ret(CLValue::from_t(format!("{}{}", base, media_id)).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn set_base_uri() {
    require_owner();
    let base: String = runtime::get_named_arg(ARG_BASE_URI);
    set_base_uri_internal(base);
}

#[no_mangle]
pub extern "C" fn burn() {
    let token_id: U256 = runtime::get_named_arg(ARG_TOKEN_ID);
    let caller = Key::Account(runtime::get_caller());
    require_token_owner(token_id, caller);

    let mut token_owner = get_token_owner();
    token_owner.remove(&token_id);
    set_token_owner(token_owner);

    let mut token_media = get_token_media_id();
    let media_id = token_media.remove(&token_id).unwrap_or_default();
    set_token_media_id(token_media);

    let mut completion = get_completion_token_id();
    completion.remove(&(caller, media_id.clone()));
    set_completion_token_id(completion);

    remove_user_token_id(caller, token_id);
    remove_media_completer(caller, media_id.clone());
    remove_group_member_internal(caller, media_id);
}

#[no_mangle]
pub extern "C" fn get_similars_from_tokens() {
    let token_ids: Vec<U256> = runtime::get_named_arg(ARG_TOKEN_IDS);
    if token_ids.is_empty() {
        runtime::ret(CLValue::from_t(Vec::<Key>::new()).unwrap_or_revert());
    }

    let token_owner = get_token_owner();
    let user = match token_owner.get(&token_ids[0]) {
        Some(v) => *v,
        None => runtime::revert(ApiError::User(9)),
    };

    let token_media = get_token_media_id();
    let media_completers = get_media_completers();

    let mut out_set = BTreeSet::<Key>::new();
    for token_id in token_ids.iter() {
        require_token_owner(*token_id, user);
        let media_id = token_media.get(token_id).cloned().unwrap_or_default();
        if let Some(completers) = media_completers.get(&media_id) {
            for candidate in completers.iter() {
                if *candidate != user {
                    out_set.insert(*candidate);
                }
            }
        }
    }

    let out: Vec<Key> = out_set.into_iter().collect();
    runtime::ret(CLValue::from_t(out).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn get_similars_for_token() {
    let token_id: U256 = runtime::get_named_arg(ARG_TOKEN_ID);
    let token_owner = get_token_owner();
    let user = match token_owner.get(&token_id) {
        Some(v) => *v,
        None => runtime::revert(ApiError::User(9)),
    };
    let token_media = get_token_media_id();
    let media_id = token_media.get(&token_id).cloned().unwrap_or_default();
    let media_completers = get_media_completers();
    let mut out = Vec::new();
    if let Some(completers) = media_completers.get(&media_id) {
        for candidate in completers.iter() {
            if *candidate != user {
                out.push(*candidate);
            }
        }
    }
    runtime::ret(CLValue::from_t(out).unwrap_or_revert());
}
