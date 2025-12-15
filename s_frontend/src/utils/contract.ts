import { CasperClient, DeployUtil, RuntimeArgs, CLValue, CLKey, CLAccountHash } from 'casper-js-sdk';
import { CONTRACT_HASH, NODE_URL, MediaType } from '@/config/constants';
import { ContractCallResult } from '@/types';

const casperClient = new CasperClient(NODE_URL);

export async function mintCompletionNFT(
  mediaId: string,
  mediaType: MediaType,
  mediaTitle: string,
  accountHash: string,
  signingKeyPair: any
): Promise<ContractCallResult> {
  try {
    const contractHash = CONTRACT_HASH || (await getStoredContractHash());
    if (!contractHash) {
      return { success: false, error: 'Contract hash not found' };
    }

    const runtimeArgs = RuntimeArgs.fromMap({
      media_id: CLValue.string(mediaId),
      media_type: CLValue.u8(mediaType),
      media_title: CLValue.string(mediaTitle),
    });

    const deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(
        CLKey.fromAccount(new CLAccountHash(Uint8Array.from(Buffer.from(accountHash, 'hex')))),
        CASPER_NETWORK,
        1,
        1800000
      ),
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Uint8Array.from(Buffer.from(contractHash.replace('contract-', ''), 'hex')),
        'mint_completion_nft',
        runtimeArgs
      ),
      DeployUtil.standardPayment(1000000000) // 1 CSPR
    );

    const signedDeploy = DeployUtil.signDeploy(deploy, signingKeyPair);
    const deployHash = await casperClient.putDeploy(signedDeploy);

    return {
      success: true,
      deployHash: Buffer.from(deployHash).toString('hex'),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to mint NFT',
    };
  }
}

export async function getUserNFTs(accountHash: string): Promise<ContractCallResult> {
  try {
    const contractHash = CONTRACT_HASH || (await getStoredContractHash());
    if (!contractHash) {
      return { success: false, error: 'Contract hash not found' };
    }

    const runtimeArgs = RuntimeArgs.fromMap({
      user_address: CLKey.fromAccount(new CLAccountHash(Uint8Array.from(Buffer.from(accountHash, 'hex')))),
    });

    // Query the contract
    const result = await casperClient.queryContractData(
      contractHash,
      'get_user_nfts',
      runtimeArgs
    );

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get user NFTs',
    };
  }
}

export async function findUsersWithMedia(mediaId: string): Promise<ContractCallResult> {
  try {
    const contractHash = CONTRACT_HASH || (await getStoredContractHash());
    if (!contractHash) {
      return { success: false, error: 'Contract hash not found' };
    }

    const runtimeArgs = RuntimeArgs.fromMap({
      media_id: CLValue.string(mediaId),
    });

    const result = await casperClient.queryContractData(
      contractHash,
      'find_users_with_media',
      runtimeArgs
    );

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to find users',
    };
  }
}

export async function canUserInteract(
  user1: string,
  user2: string,
  mediaId: string
): Promise<ContractCallResult> {
  try {
    const contractHash = CONTRACT_HASH || (await getStoredContractHash());
    if (!contractHash) {
      return { success: false, error: 'Contract hash not found' };
    }

    const runtimeArgs = RuntimeArgs.fromMap({
      user1: CLKey.fromAccount(new CLAccountHash(Uint8Array.from(Buffer.from(user1, 'hex')))),
      user2: CLKey.fromAccount(new CLAccountHash(Uint8Array.from(Buffer.from(user2, 'hex')))),
      media_id: CLValue.string(mediaId),
    });

    const result = await casperClient.queryContractData(
      contractHash,
      'can_user_interact',
      runtimeArgs
    );

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to check interaction',
    };
  }
}

async function getStoredContractHash(): Promise<string | null> {
  const stored = localStorage.getItem('contract_hash');
  return stored || null;
}

