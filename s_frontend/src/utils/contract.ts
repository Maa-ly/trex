import { CasperClient, DeployUtil, RuntimeArgs, CLValueBuilder, CLPublicKey } from 'casper-js-sdk';
import {
  CHAIN_NAME,
  CONTRACT_HASH,
  CONTRACT_NAME,
  DEPLOY_TTL_MS,
  ENTRYPOINT_PAYMENT_AMOUNT,
  NODE_URL,
  MediaType,
} from '@/config/constants';
import { ContractCallResult } from '@/types';

const casperClient = new CasperClient(NODE_URL);

function hexToUint8Array(hex: string): Uint8Array {
  const normalized = hex.startsWith('hash-')
    ? hex.slice(5)
    : hex.startsWith('contract-')
      ? hex.slice(9)
      : hex;
  const len = normalized.length;
  const out = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    out[i / 2] = parseInt(normalized.substring(i, i + 2), 16);
  }
  return out;
}

export async function mintCompletionNFT(
  mediaId: string,
  mediaType: MediaType,
  mediaTitle: string,
  publicKeyHex: string,
  signingKeyPair: any,
  onStatusUpdate?: (status: string, data: any) => void
): Promise<ContractCallResult> {
  try {
    if (!publicKeyHex) {
      return { success: false, error: 'Public key required' };
    }

    const deployParams = new DeployUtil.DeployParams(
      CLPublicKey.fromHex(publicKeyHex),
      CHAIN_NAME,
      1,
      DEPLOY_TTL_MS
    );

    const args = RuntimeArgs.fromMap({
      media_id: CLValueBuilder.string(mediaId),
      media_type: CLValueBuilder.u8(mediaType),
      media_title: CLValueBuilder.string(mediaTitle),
    });

    const session =
      CONTRACT_HASH && CONTRACT_HASH.length > 0
        ? DeployUtil.ExecutableDeployItem.newStoredContractByHash(
            hexToUint8Array(CONTRACT_HASH),
            'mint_completion_nft',
            args
          )
        : DeployUtil.ExecutableDeployItem.newStoredContractByName(
            CONTRACT_NAME,
            'mint_completion_nft',
            args
          );

    const payment = DeployUtil.standardPayment(ENTRYPOINT_PAYMENT_AMOUNT);
    const deploy = await DeployUtil.makeDeployWithAutoTimestamp(deployParams, session, payment);
    const w = window as any;
    if (w?.csprclick?.send) {
      const deployJson = DeployUtil.deployToJson(deploy);
      const result = await w.csprclick.send(deployJson, publicKeyHex, onStatusUpdate);
      const deployHash = result?.deployHash || result?.transactionHash;
      return { success: true, deployHash };
    } else {
      if (!signingKeyPair) {
        return { success: false, error: 'Wallet signer unavailable' };
      }
      const signed = DeployUtil.signDeploy(deploy, signingKeyPair);
      const deployHash = await casperClient.putDeploy(signed);
      return { success: true, deployHash };
    }
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

export async function getUserNFTs(_accountHash: string): Promise<ContractCallResult> {
  return { success: true, data: [] };
}

export async function findUsersWithMedia(_mediaId: string): Promise<ContractCallResult> {
  return { success: true, data: [] };
}

export async function canUserInteract(
  _user1: string,
  _user2: string,
  _mediaId: string
): Promise<ContractCallResult> {
  return { success: true, data: { canInteract: true } };
}
