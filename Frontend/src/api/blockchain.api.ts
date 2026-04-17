import apiClient from './client';

export interface BlockchainWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  blockchain_network: 'ethereum' | 'polygon' | 'binance_smart_chain' | 'solana' | 'avalanche';
  created_at: string;
  credential_count?: number;
  nft_count?: number;
}

export interface VerifiableCredential {
  id: string;
  user_id: string;
  credential_type: 'certificate' | 'badge' | 'diploma' | 'transcript' | 'skill_verification';
  credential_name: string;
  course_id?: string;
  blockchain_network?: string;
  did_identifier?: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
  expiry_date?: string;
  revoked_at?: string;
}

export interface NFTCertificate {
  id: string;
  certificate_id: string;
  blockchain_network: string;
  contract_address: string;
  token_id: string;
  nft_name: string;
  mint_status: 'pending' | 'minting' | 'minted' | 'failed';
  transaction_hash?: string;
  minted_at?: string;
}

export interface BlockchainTransaction {
  id: string;
  transaction_hash: string;
  blockchain_network: string;
  transaction_type: string;
  from_address?: string;
  to_address?: string;
  amount?: number;
  gas_used?: number;
  status: string;
  created_at: string;
}

export interface CredentialSummary {
  user_id: string;
  summary: {
    total_credentials: number;
    active_credentials: number;
    revoked_credentials: number;
    certificates: number;
    badges: number;
    diplomas: number;
    networks: string[];
  };
}

export const blockchainApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{
      status: string;
      timestamp: string;
      metrics: any;
      supported_networks: string[];
    }>('/blockchain/health'),

  // Wallets
  createWallet: (data: {
    user_id: string;
    wallet_address: string;
    blockchain_network: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/blockchain/wallets', data),

  getWallets: (userId: string) =>
    apiClient.get<{ user_id: string; wallets: BlockchainWallet[]; count: number }>(
      `/blockchain/wallets/${userId}`
    ),

  verifyWalletOwnership: (walletAddress: string, userId: string) =>
    apiClient.get<{
      wallet_address: string;
      user_id: string;
      is_owner: boolean;
      verified_at: string;
    }>('/blockchain/wallets/verify', {
      params: { wallet_address: walletAddress, user_id: userId }
    }),

  // Verifiable Credentials
  issueCredential: (data: {
    user_id: string;
    credential_type: string;
    credential_name: string;
    course_id?: string;
    blockchain_network?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/blockchain/credentials', data),

  getCredentialById: (credentialId: string) =>
    apiClient.get<VerifiableCredential>(`/blockchain/credentials/${credentialId}`),

  verifyCredential: (credentialId: string) =>
    apiClient.get<{
      is_valid: boolean;
      validation_message: string;
      status: string;
      expiry_date?: string;
    }>(`/blockchain/credentials/${credentialId}/verify`),

  revokeCredential: (credentialId: string, reason?: string, revokedBy?: string) =>
    apiClient.post<{ message: string; credential_id: string }>(
      `/blockchain/credentials/${credentialId}/revoke`,
      { reason, revoked_by: revokedBy }
    ),

  getUserCredentialsSummary: (userId: string) =>
    apiClient.get<CredentialSummary>(`/blockchain/credentials/user/${userId}/summary`),

  // NFT Certificates
  mintNFT: (data: {
    certificate_id: string;
    blockchain_network: string;
    contract_address: string;
    token_id: string;
    nft_name: string;
  }) =>
    apiClient.post<{ id: string; status: string; message: string }>('/blockchain/nft/mint', data),

  updateNFTMintStatus: (nftId: string, mintStatus: string, transactionHash?: string) =>
    apiClient.put<{ message: string; nft_id: string; status: string }>(
      `/blockchain/nft/${nftId}/status`,
      { mint_status: mintStatus, transaction_hash: transactionHash }
    ),

  getNFTs: (userId?: string) =>
    apiClient.get<{ nfts: NFTCertificate[]; count: number }>(
      '/blockchain/nft',
      { params: { user_id: userId } }
    ),

  // Transactions
  recordTransaction: (data: {
    transaction_hash: string;
    blockchain_network: string;
    transaction_type: string;
    from_address?: string;
    to_address?: string;
    amount?: number;
    gas_used?: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/blockchain/transactions', data),

  getTransactions: (params?: {
    blockchain_network?: string;
    transaction_type?: string;
    user_address?: string;
    limit?: number;
  }) =>
    apiClient.get<{ transactions: BlockchainTransaction[]; count: number }>(
      '/blockchain/transactions',
      { params }
    ),
};
