// Wallet integration using CSPR.click

export interface WalletConnection {
  accountHash: string;
  publicKey: string;
  isConnected: boolean;
}

export async function connectWallet(): Promise<WalletConnection | null> {
  try {
    const w = window as any;
    if (!w.csprclick) {
      console.warn('CSPR.click runtime not loaded');
      return null;
    }

    w.csprclick.init({
      appName: 'Media NFT Tracker',
      appId: 'csprclick-template',
      contentMode: 'IFRAME',
      providers: ['casper-wallet', 'casper-signer', 'ledger', 'casperdash'],
    });

    await w.csprclick.connect('casper-wallet', {});
    const publicKey: string | undefined = await w.csprclick.getActivePublicKey();
    if (!publicKey) return null;

    const { CLPublicKey } = await import('casper-js-sdk');
    const accountHash = CLPublicKey.fromHex(publicKey).toAccountRawHashStr();

    return {
      accountHash,
      publicKey,
      isConnected: true,
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    const w = window as any;
    if (w.csprclick) {
      w.csprclick.disconnect('', {});
    }
  } catch (e) {
    console.warn('Failed to disconnect wallet', e);
  }
}

export async function signMessage(_message: string, _accountHash: string): Promise<string | null> {
  try {
    const w = window as any;
    if (!w.csprclick) return null;
    const pk: string | undefined = await w.csprclick.getActivePublicKey();
    if (!pk) return null;
    const res = await w.csprclick.signMessage(_message, pk);
    if (res?.cancelled) return null;
    return res?.signature || null;
  } catch (error) {
    console.error('Failed to sign message:', error);
    return null;
  }
}
