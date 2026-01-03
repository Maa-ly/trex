#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR" && pwd)"

CASPER_CLIENT="${CASPER_CLIENT:-}"
if [[ -z "$CASPER_CLIENT" ]]; then
  CASPER_CLIENT="$(command -v casper-client || true)"
fi
if [[ -z "$CASPER_CLIENT" && -x "$HOME/.cargo/bin/casper-client" ]]; then
  CASPER_CLIENT="$HOME/.cargo/bin/casper-client"
fi
if [[ -z "$CASPER_CLIENT" ]]; then
  echo "casper-client not found. Install it with:"
  echo "  cargo install casper-client --locked"
  exit 1
fi

NODE_ADDRESS="${NODE_ADDRESS:-https://node.testnet.casper.network/rpc}"
CHAIN_NAME="${CHAIN_NAME:-casper-test}"
PAYMENT_AMOUNT="${PAYMENT_AMOUNT:-500000000000}"
SECRET_KEY="${SECRET_KEY:-}"
PUBLIC_KEY_HEX="${PUBLIC_KEY_HEX:-}"

CONTRACT_NAME="${CONTRACT_NAME:-media_nft_contract}"
WASM_FILE="${ROOT_DIR}/target/wasm32-unknown-unknown/release/media_nft_contract.wasm"

if [[ -z "$SECRET_KEY" ]]; then
  echo "Missing SECRET_KEY. Example:"
  echo "  SECRET_KEY=/path/to/secret_key.pem PUBLIC_KEY_HEX=<hex> $0"
  exit 1
fi

echo "Building contract..."
make -C "$ROOT_DIR" build

if [[ ! -f "$WASM_FILE" ]]; then
  echo "Error: WASM file not found at $WASM_FILE"
  exit 1
fi

echo "Sending deploy..."
DEPLOY_OUT_FILE="$(mktemp)"
DEPLOY_ERR_FILE="$(mktemp)"
DEPLOY_STATUS=0
set +e
"$CASPER_CLIENT" put-deploy \
  --node-address "$NODE_ADDRESS" \
  --chain-name "$CHAIN_NAME" \
  --secret-key "$SECRET_KEY" \
  --payment-amount "$PAYMENT_AMOUNT" \
  --session-path "$WASM_FILE" >"$DEPLOY_OUT_FILE" 2>"$DEPLOY_ERR_FILE"
DEPLOY_STATUS="$?"
set -e

DEPLOY_OUT="$(cat "$DEPLOY_OUT_FILE")"
DEPLOY_ERR="$(cat "$DEPLOY_ERR_FILE")"
rm -f "$DEPLOY_OUT_FILE" "$DEPLOY_ERR_FILE"

if [[ "${DEPLOY_STATUS:-1}" -ne 0 ]]; then
  echo "casper-client put-deploy failed:"
  if [[ -n "$DEPLOY_ERR" ]]; then
    echo "$DEPLOY_ERR"
  fi
  if [[ -n "$DEPLOY_OUT" ]]; then
    echo "$DEPLOY_OUT"
  fi
  exit 1
fi

if [[ -z "$DEPLOY_OUT" ]]; then
  echo "casper-client put-deploy returned empty output."
  if [[ -n "$DEPLOY_ERR" ]]; then
    echo "$DEPLOY_ERR"
  fi
  exit 1
fi

if ! DEPLOY_HASH="$(INPUT="$DEPLOY_OUT" python3 - <<'PY'
import json
import os

s = (os.environ.get("INPUT") or "").strip()
json_start = s.find("{")
s_json = s[json_start:] if json_start != -1 else s
data = json.loads(s_json)
print(data["result"]["deploy_hash"])
PY
)"; then
  echo "Failed to parse deploy hash from casper-client output:"
  echo "$DEPLOY_OUT"
  exit 1
fi

echo "Deploy hash: $DEPLOY_HASH"

BLOCK_HASH=""
for _ in $(seq 1 60); do
  DEPLOY_INFO="$("$CASPER_CLIENT" get-deploy --node-address "$NODE_ADDRESS" "$DEPLOY_HASH")"
  PARSED="$(INPUT="$DEPLOY_INFO" python3 - <<'PY'
import json
import os

data = json.loads(os.environ.get("INPUT") or "")
r = data.get("result", {}) or {}
if "execution_info" in r and r.get("execution_info"):
  info = r["execution_info"]
  block_hash = info.get("block_hash") or ""
  exec_result = info.get("execution_result") or {}
  v2 = exec_result.get("Version2") or {}
  err = (v2.get("error_message") or "").strip()
  if err:
    print("failure\t" + block_hash + "\t" + err)
  else:
    print("success\t" + block_hash + "\t")
  raise SystemExit(0)

results = r.get("execution_results", [])
if not results:
  print("pending\t\t")
  raise SystemExit(0)
res0 = results[0]
result = res0.get("result", {})
block_hash = res0.get("block_hash", "") or ""
if "Success" in result:
  print("success\t" + block_hash + "\t")
elif "Failure" in result:
  print("failure\t" + block_hash + "\t")
else:
  print("pending\t\t")
PY
)"

  STATUS="${PARSED%%$'\t'*}"
  REST="${PARSED#*$'\t'}"
  BLOCK_HASH="${REST%%$'\t'*}"
  ERR_MSG="${REST#*$'\t'}"

  if [[ "$STATUS" == "success" ]]; then
    break
  fi
  if [[ "$STATUS" == "failure" ]]; then
    if [[ -n "$ERR_MSG" ]]; then
      echo "Deploy failed: $ERR_MSG"
    fi
    echo "Deploy failed. Inspect with:"
    echo "  $CASPER_CLIENT get-deploy --node-address \"$NODE_ADDRESS\" \"$DEPLOY_HASH\""
    exit 1
  fi
  sleep 5
done

if [[ -z "$BLOCK_HASH" ]]; then
  echo "Timed out waiting for deploy execution. Inspect with:"
  echo "  $CASPER_CLIENT get-deploy --node-address \"$NODE_ADDRESS\" \"$DEPLOY_HASH\""
  exit 1
fi

CONTRACT_HASH=""
CONTRACT_PACKAGE_HASH=""
CONTRACT_WASM_HASH=""

DEPLOY_INFO="$("$CASPER_CLIENT" get-deploy --node-address "$NODE_ADDRESS" "$DEPLOY_HASH")"
CONTRACT_HASH="$(INPUT="$DEPLOY_INFO" python3 - <<'PY'
import json
import os

data = json.loads(os.environ.get("INPUT") or "")
r = data.get("result", {}) or {}
if "execution_info" in r and r.get("execution_info"):
  info = r["execution_info"]
  exec_result = info.get("execution_result") or {}
  v2 = exec_result.get("Version2") or {}
  effects = v2.get("effects") or []
  for eff in effects:
    key = eff.get("key") or ""
    kind = eff.get("kind") or {}
    if isinstance(key, str) and key.startswith("hash-") and "Write" in kind:
      write = kind.get("Write") or {}
      if "Contract" in write:
        print(key)
        raise SystemExit(0)

results = r.get("execution_results", [])
if results:
  res0 = results[0].get("result", {})
  success = res0.get("Success") or {}
  effect = success.get("effect") or {}
  transforms = effect.get("transforms") or []
  for t in transforms:
    tr = t.get("transform") or {}
    if "WriteContract" in tr:
      key = t.get("key") or ""
      if isinstance(key, str) and key.startswith("hash-"):
        print(key)
        raise SystemExit(0)
print("")
PY
)"

if [[ -z "$CONTRACT_HASH" && -n "$PUBLIC_KEY_HEX" ]]; then
  ACCOUNT_INFO="$("$CASPER_CLIENT" get-account \
    --node-address "$NODE_ADDRESS" \
    --block-identifier "$BLOCK_HASH" \
    --account-identifier "$PUBLIC_KEY_HEX")"

  CONTRACT_HASH="$(INPUT="$ACCOUNT_INFO" CONTRACT_NAME="$CONTRACT_NAME" python3 - <<'PY'
import json
import os

contract_name = os.environ["CONTRACT_NAME"]
data = json.loads(os.environ.get("INPUT") or "")
stored_value = data.get("result", {}).get("stored_value", {})
account = stored_value.get("Account") or stored_value.get("AddressableEntity") or {}
named_keys = account.get("named_keys", [])
for item in named_keys:
  if item.get("name") == contract_name:
    key = item.get("key") or ""
    if isinstance(key, str) and key.startswith("hash-"):
      print(key)
      raise SystemExit(0)
print("")
PY
)"
fi

if [[ -n "$CONTRACT_HASH" ]]; then
  CONTRACT_INFO="$("$CASPER_CLIENT" query-global-state \
    --node-address "$NODE_ADDRESS" \
    --block-identifier "$BLOCK_HASH" \
    --key "$CONTRACT_HASH")"

  read -r CONTRACT_PACKAGE_HASH CONTRACT_WASM_HASH <<<"$(INPUT="$CONTRACT_INFO" python3 - <<'PY'
import json
import os

data = json.loads(os.environ.get("INPUT") or "")
sv = data.get("result", {}).get("stored_value", {})
contract = sv.get("Contract") or {}
print(contract.get("contract_package_hash",""), contract.get("contract_wasm_hash",""))
PY
)"
fi

echo ""
echo "Integration values:"
if [[ -n "$CONTRACT_HASH" ]]; then
  echo "  VITE_CONTRACT_HASH=$CONTRACT_HASH"
fi
echo "  VITE_CONTRACT_NAME=$CONTRACT_NAME"
echo "  VITE_CASPER_NETWORK=testnet"
echo "  VITE_CHAIN_NAME=$CHAIN_NAME"
echo "  VITE_NODE_URL=$NODE_ADDRESS"

if [[ -n "$CONTRACT_PACKAGE_HASH" ]]; then
  echo "  CONTRACT_PACKAGE_HASH=$CONTRACT_PACKAGE_HASH"
fi
if [[ -n "$CONTRACT_WASM_HASH" ]]; then
  echo "  CONTRACT_WASM_HASH=$CONTRACT_WASM_HASH"
fi

FRONTEND_DIR="${ROOT_DIR}/../s_frontend"
if [[ -n "$CONTRACT_HASH" && -d "$FRONTEND_DIR" ]]; then
  FRONTEND_DIR="$FRONTEND_DIR" CONTRACT_HASH="$CONTRACT_HASH" CONTRACT_NAME="$CONTRACT_NAME" NODE_ADDRESS="$NODE_ADDRESS" CHAIN_NAME="$CHAIN_NAME" python3 - <<'PY'
from pathlib import Path
import re
import os

frontend_dir = Path(os.environ["FRONTEND_DIR"])
contract_hash = os.environ["CONTRACT_HASH"]
contract_name = os.environ.get("CONTRACT_NAME", "media_nft_contract")
node_url = os.environ["NODE_ADDRESS"]
chain_name = os.environ["CHAIN_NAME"]

targets = [frontend_dir / ".env", frontend_dir / ".env.example"]

def upsert(text: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    pattern = re.compile(rf"^(?:#\\s*)?{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(text):
        return pattern.sub(line, text)
    if text and not text.endswith("\\n"):
        text += "\\n"
    return text + line + "\\n"

for path in targets:
    if not path.exists():
        continue
    content = path.read_text()
    content = upsert(content, "VITE_CONTRACT_HASH", contract_hash)
    content = upsert(content, "VITE_CONTRACT_NAME", contract_name)
    content = upsert(content, "VITE_CHAIN_NAME", chain_name)
    content = upsert(content, "VITE_NODE_URL", node_url)
    path.write_text(content)
PY
fi
