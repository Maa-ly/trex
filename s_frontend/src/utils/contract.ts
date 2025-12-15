import { MediaType } from '@/config/constants';
import { ContractCallResult } from '@/types';

export async function mintCompletionNFT(
  mediaId: string,
  _mediaType: MediaType,
  _mediaTitle: string,
  _accountHash: string,
  _signingKeyPair: any
): Promise<ContractCallResult> {
  const mockDeployHash = `mock-${mediaId}-${Date.now()}`;
  return { success: true, deployHash: mockDeployHash };
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
