import apiClient from './client';
export const blockchainApi = {
    // Health check
    healthCheck: () => apiClient.get('/blockchain/health'),
    // Wallets
    createWallet: (data) => apiClient.post('/blockchain/wallets', data),
    getWallets: (userId) => apiClient.get(`/blockchain/wallets/${userId}`),
    verifyWalletOwnership: (walletAddress, userId) => apiClient.get('/blockchain/wallets/verify', {
        params: { wallet_address: walletAddress, user_id: userId }
    }),
    // Verifiable Credentials
    issueCredential: (data) => apiClient.post('/blockchain/credentials', data),
    getCredentialById: (credentialId) => apiClient.get(`/blockchain/credentials/${credentialId}`),
    verifyCredential: (credentialId) => apiClient.get(`/blockchain/credentials/${credentialId}/verify`),
    revokeCredential: (credentialId, reason, revokedBy) => apiClient.post(`/blockchain/credentials/${credentialId}/revoke`, { reason, revoked_by: revokedBy }),
    getUserCredentialsSummary: (userId) => apiClient.get(`/blockchain/credentials/user/${userId}/summary`),
    // NFT Certificates
    mintNFT: (data) => apiClient.post('/blockchain/nft/mint', data),
    updateNFTMintStatus: (nftId, mintStatus, transactionHash) => apiClient.put(`/blockchain/nft/${nftId}/status`, { mint_status: mintStatus, transaction_hash: transactionHash }),
    getNFTs: (userId) => apiClient.get('/blockchain/nft', { params: { user_id: userId } }),
    // Transactions
    recordTransaction: (data) => apiClient.post('/blockchain/transactions', data),
    getTransactions: (params) => apiClient.get('/blockchain/transactions', { params }),
};
