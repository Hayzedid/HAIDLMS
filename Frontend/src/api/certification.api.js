import apiClient from "./client";
export const certificationApi = {
    // Get user's badges and certificates
    getUserBadges: () => apiClient
        .get("/api/certification/badges/users/me")
        .then((r) => r.data),
    // Get blockchain certificates
    getUserBlockchainCertificates: () => apiClient
        .get("/api/certification/blockchain/certificates")
        .then((r) => r.data),
    // Get single blockchain certificate
    getBlockchainCertificate: (certificateId) => apiClient
        .get(`/api/certification/blockchain/certificates/${certificateId}`)
        .then((r) => r.data),
    // Verify badge on blockchain
    verifyBadge: (badgeHash) => apiClient
        .get(`/api/certification/badges/verify/${badgeHash}`)
        .then((r) => r.data),
    // Get badge details
    getBadgeDetails: (badgeHash) => apiClient
        .get(`/api/certification/badges/json/${badgeHash}`)
        .then((r) => r.data),
    // Generate LinkedIn share URL
    generateLinkedInShareUrl: (badgeHash) => apiClient
        .get(`/api/certification/badges/${badgeHash}/linkedin-share`)
        .then((r) => r.data),
    // Share badge to LinkedIn
    shareToLinkedIn: (badgeHash) => apiClient.post(`/api/certification/badges/${badgeHash}/linkedin-share`, {}),
    // Issue badge (instructor/admin)
    issueBadge: (data) => apiClient
        .post("/api/certification/badges/issue", data)
        .then((r) => r.data),
    // Batch issue badges
    batchIssueBadges: (data) => apiClient
        .post("/api/certification/badges/batch-issue", data)
        .then((r) => r.data),
    // Revoke badge
    revokeBadge: (badgeHash, reason) => apiClient
        .post(`/api/certification/badges/${badgeHash}/revoke`, { reason })
        .then((r) => r.data),
    // Get badge statistics
    getBadgeStatistics: (badgeClassId) => apiClient
        .get(`/api/certification/badges/statistics${badgeClassId ? `?badgeClassId=${badgeClassId}` : ""}`)
        .then((r) => r.data),
    // Blockchain - mint certificate as NFT
    mintBlockchainCertificate: (data) => apiClient
        .post("/api/certification/blockchain/mint", data)
        .then((r) => r.data),
    // Blockchain - verify certificate on-chain
    verifyBlockchainCertificate: (transactionHash) => apiClient
        .get(`/api/certification/blockchain/verify/${transactionHash}`)
        .then((r) => r.data),
    // Blockchain - transfer NFT certificate
    transferBlockchainCertificate: (tokenId, toWalletAddress) => apiClient
        .post(`/api/certification/blockchain/transfer`, { tokenId, toWalletAddress })
        .then((r) => r.data),
    // Download badge/certificate
    downloadCertificate: (certificateId, format = "pdf") => apiClient
        .get(`/api/certification/certificates/${certificateId}/download?format=${format}`, {
        responseType: "blob",
    })
        .then((r) => r.data),
};
