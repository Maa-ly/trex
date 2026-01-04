Casper:  
 wallet sdk[https://docs.cspr.click/](https://docs.cspr.click/)  
  
cloud service[https://docs.cspr.cloud/](https://docs.cspr.cloud/)  
  
blockscan[https://testnet.cspr.live/](https://testnet.cspr.live/)  
  
casper dev docs  
[https://docs.casper.network/developers](https://docs.casper.network/developers)  
  
dApp docs  
[https://docs.casper.network/developers/dapps](https://docs.casper.network/developers/dapps)  
  
[https://cspr.build/cspr-click/](https://cspr.build/cspr-click/)  
  
  
  
Indexed file  
https://github.com/casper-ecosystem/lottery-demo-dapp/tree/main  
  
```from context7  
  
  
What did they use for the smart contract function interegrationfor the frontend  
I'll fetch documentation about the smart contract function integration for the frontend.  
getDocs  
topic:  
smart contract function integration frontend  
mode:  
code  
page:  
1  
##   
Based on the documentation, the lottery demo dApp uses several key technologies for smart contract function integration on the frontend:  
**Proxy Caller Pattern**  
The primary mechanism for frontend-to-smart-contract integration is the **proxy caller pattern**. Here's what was used:  
1. **SessionBuilder** - Used to construct and prepare blockchain transactions  
2. **Args/CLValue** - For serializing arguments to send to the smart contract  
3. **Wasm** - A proxy WASM module that acts as an intermediary between the frontend and the smart contract  
**Key Implementation Details:**  
The frontend prepares transactions using:  
```
export const preparePlayTransaction = async (
  playerPublicKey: PublicKey
): Promise<Transaction> => {
  const args_bytes: Uint8Array = Args.fromMap({}).toBytes();

  const serialized_args = CLValue.newCLList(CLTypeUInt8,
    Array.from(args_bytes)
      .map(value => CLValue.newCLUint8(value))
  );

  const priceInMotes = CSPRToMotes(config.lottery_ticket_price_in_cspr);

  const args = Args.fromMap({
    amount: CLValue.newCLUInt512(priceInMotes),
    attached_value: CLValue.newCLUInt512(priceInMotes),
    entry_point: CLValue.newCLString("play_lottery"),
    contract_package_hash: CLValue.newCLByteArray(Hash.fromHex(config.lottery_app_contract_package_hash).toBytes()),
    args: serialized_args,
  });

  const paymentInMotes = CSPRToMotes(config.gas_price_in_cspr);
  const wasm = await getProxyWASM();

  const sessionTx = new SessionBuilder()
    .from(playerPublicKey)
    .runtimeArgs(args)
    .wasm(wasm)
    .payment(paymentInMotes)
    .chainName(config.cspr_chain_name)
    .build();

  return sessionTx;
};

```
**Event Listening**  
For real-time updates, they implemented a **WebSocket stream listener** connected to CSPR.cloud's streaming API to listen for contract events and persist them to the database.  
This approach allows the frontend to call smart contract functions while abstracting away the complexity of direct blockchain interaction.  
so like in evm its wagmi and in casper its wasm  
Not quite! Let me clarify the distinction:  
**WAGMI** (in EVM) is a **React hooks library** that provides a higher-level abstraction for interacting with smart contracts and wallets. It handles things like contract calls, state management, and wallet connections through a convenient hooks interface.  
**WASM** (in Casper) is the actual **compiled bytecode format** (WebAssembly) that gets deployed and executed on the blockchain. In this demo, they're using a **proxy WASM module** as an intermediary layer.  
The more accurate comparison would be:  
* **EVM**: WAGMI (or ethers.js/web3.js) → Smart Contract  
* **Casper**: SessionBuilder + CLValue + Proxy WASM → Smart Contract  
So in the Casper lottery demo:  
1. **SessionBuilder** is similar to WAGMI's role - it helps construct transactions  
2. **CLValue** handles argument serialization (like web3's encoding utilities)  
3. **Proxy WASM** is a special pattern unique to Casper that acts as an intermediary contract caller  
The key difference is that Casper uses the **proxy caller pattern** where a WASM module wraps the actual smart contract call, whereas EVM-based dApps typically call contracts more directly through libraries like WAGMI or ethers.js.  
So it's not WASM as a direct equivalent to WAGMI, but rather WASM is a component of Casper's transaction construction process, combined with other utilities like SessionBuilder and CLValue.  
um... explain the sesssionBuilder a bit more  
getDocs  
topic:  
SessionBuilder transaction construction  
mode:  
code  
page:  
1  
##   
getDocs  
topic:  
SessionBuilder architecture  
mode:  
info  
page:  
1  
##   
Great question! Let me break down **SessionBuilder** for you.  
**What is SessionBuilder?**  
**SessionBuilder** is a builder pattern object used to construct a **session transaction** on the Casper blockchain. Think of it as a transaction factory that assembles all the pieces needed to execute a smart contract call.  
**The Chain of Methods**  
Looking at the code, SessionBuilder uses method chaining:  
```
const sessionTx = new SessionBuilder()
  .from(playerPublicKey)              // 1. Who is sending this?
  .runtimeArgs(args)                  // 2. What arguments to pass?
  .wasm(wasm)                         // 3. What code to execute?
  .payment(paymentInMotes)            // 4. How much gas?
  .chainName(config.cspr_chain_name)  // 5. Which chain?
  .build();                           // 6. Create the final transaction

```
**Breaking Down Each Part**  

| Method | Purpose | Example |
| -------------- | -------------------------------------------- | ------------------------------------------------ |
| .from() | Specifies the signer (player's public key) | The player paying for the transaction |
| .runtimeArgs() | Passes all the contract arguments | amount, entry_point, contract_package_hash, etc. |
| .wasm() | Specifies the WASM code to execute | The proxy WASM that calls the actual contract |
| .payment() | Sets the gas fees for the transaction | Converted CSPR to motes |
| .chainName() | Specifies which Casper network | "casper" for mainnet or testnet name |
| .build() | Finalizes and returns the Transaction object | Ready to sign and deploy |
  
****In Simple Terms****  
**SessionBuilder is like filling out a form with all the transaction details:**  
* Who: Player  
* What: Call play_lottery  
* How Much: 50 CSPR (+ gas)  
* Where: Proxy WASM contract  
* Which Chain: Casper mainnet  
Once you call ****.build()****, you get back a ****Transaction**** object that's ready to be signed and sent to the blockchain.  
  
```  
  
