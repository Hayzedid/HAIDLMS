import apiClient from "./client";

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: "badge" | "certificate";
  badgeHash: string;
  issuedAt: string;
  issuer: string;
  credentialUrl?: string;
}

export interface BlockchainCertificate {
  id: string;
  courseName: string;
  issuedDate: string;
  recipientName: string;
  recipientEmail: string;
  issuerName: string;
  issuerAddress: string;
  transactionHash: string;
  contractAddress: string;
  tokenId: string;
  blockchainNetwork: string;
  blockchainExplorerUrl: string;
}

export const certificationApi = {
  // Get user's badges and certificates
  getUserBadges: () =>
    apiClient
      .get<Badge[]>("/api/certification/badges/users/me")
      .then((r) => r.data),

  // Get blockchain certificates
  getUserBlockchainCertificates: () =>
    apiClient
      .get<
        BlockchainCertificate[]
      >("/api/certification/blockchain/certificates")
      .then((r) => r.data),

  // Get single blockchain certificate
  getBlockchainCertificate: (certificateId: string) =>
    apiClient
      .get<BlockchainCertificate>(
        `/api/certification/blockchain/certificates/${certificateId}`,
      )
      .then((r) => r.data),

  // Verify badge on blockchain
  verifyBadge: (badgeHash: string) =>
    apiClient
      .get<{
        verified: boolean;
        metadata: any;
      }>(`/api/certification/badges/verify/${badgeHash}`)
      .then((r) => r.data),

  // Get badge details
  getBadgeDetails: (badgeHash: string) =>
    apiClient
      .get<any>(`/api/certification/badges/json/${badgeHash}`)
      .then((r) => r.data),

  // Generate LinkedIn share URL
  generateLinkedInShareUrl: (badgeHash: string) =>
    apiClient
      .get<{
        shareUrl: string;
      }>(`/api/certification/badges/${badgeHash}/linkedin-share`)
      .then((r) => r.data),

  // Share badge to LinkedIn
  shareToLinkedIn: (badgeHash: string) =>
    apiClient.post<{ message: string }>(
      `/api/certification/badges/${badgeHash}/linkedin-share`,
      {},
    ),

  // Issue badge (instructor/admin)
  issueBadge: (data: {
    studentId: string;
    badgeClassId: string;
    recipientEmail: string;
    recipientName?: string;
  }) =>
    apiClient
      .post<{
        badgeHash: string;
        message: string;
      }>("/api/certification/badges/issue", data)
      .then((r) => r.data),

  // Batch issue badges
  batchIssueBadges: (data: { badgeClassId: string; studentIds: string[] }) =>
    apiClient
      .post<{
        issued: number;
        failed: number;
      }>("/api/certification/badges/batch-issue", data)
      .then((r) => r.data),

  // Revoke badge
  revokeBadge: (badgeHash: string, reason?: string) =>
    apiClient
      .post<{
        message: string;
      }>(`/api/certification/badges/${badgeHash}/revoke`, { reason })
      .then((r) => r.data),

  // Get badge statistics
  getBadgeStatistics: (badgeClassId?: string) =>
    apiClient
      .get<any>(
        `/api/certification/badges/statistics${badgeClassId ? `?badgeClassId=${badgeClassId}` : ""}`,
      )
      .then((r) => r.data),

  // Blockchain - mint certificate as NFT
  mintBlockchainCertificate: (data: {
    courseId: string;
    userId: string;
    blockchainNetwork: "ethereum" | "polygon" | "arbitrum";
  }) =>
    apiClient
      .post<BlockchainCertificate>("/api/certification/blockchain/mint", data)
      .then((r) => r.data),

  // Blockchain - verify certificate on-chain
  verifyBlockchainCertificate: (transactionHash: string) =>
    apiClient
      .get<{
        verified: boolean;
        data: BlockchainCertificate;
      }>(`/api/certification/blockchain/verify/${transactionHash}`)
      .then((r) => r.data),

  // Blockchain - transfer NFT certificate
  transferBlockchainCertificate: (tokenId: string, toWalletAddress: string) =>
    apiClient
      .post<{
        transactionHash: string;
        message: string;
      }>(`/api/certification/blockchain/transfer`, { tokenId, toWalletAddress })
      .then((r) => r.data),

  // Download badge/certificate
  downloadCertificate: (certificateId: string, format: "pdf" | "png" = "pdf") =>
    apiClient
      .get(
        `/api/certification/certificates/${certificateId}/download?format=${format}`,
        {
          responseType: "blob",
        },
      )
      .then((r) => r.data),
};
