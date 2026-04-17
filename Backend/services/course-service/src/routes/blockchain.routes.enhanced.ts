import { Router } from 'express';
import { BlockchainControllerEnhanced } from '../controllers/blockchain.controller.enhanced';
import { Pool } from 'pg';

export const createBlockchainRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new BlockchainControllerEnhanced(pool);

  // ========================================
  // HEALTH CHECK
  // ========================================

  /**
   * @swagger
   * /api/blockchain/health:
   *   get:
   *     summary: Blockchain service health check
   *     description: Checks blockchain integration health and metrics
   *     tags: [Blockchain - System]
   *     responses:
   *       200:
   *         description: System healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 metrics:
   *                   type: object
   *                   properties:
   *                     total_wallets:
   *                       type: integer
   *                     active_credentials:
   *                       type: integer
   *                     minted_nfts:
   *                       type: integer
   *                     pending_nft_mints:
   *                       type: integer
   *                 supported_networks:
   *                   type: array
   *                   items:
   *                     type: string
   */
  router.get('/health', controller.blockchainHealthCheck);

  // ========================================
  // BLOCKCHAIN WALLETS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/blockchain/wallets:
   *   post:
   *     summary: Create blockchain wallet (Enhanced)
   *     description: Creates wallet record with validation and duplicate checking
   *     tags: [Blockchain - Wallets]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - wallet_address
   *               - blockchain_network
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 description: User UUID
   *               wallet_address:
   *                 type: string
   *                 minLength: 26
   *                 maxLength: 255
   *                 description: Blockchain wallet address
   *                 example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
   *               blockchain_network:
   *                 type: string
   *                 enum: [ethereum, polygon, binance_smart_chain, solana, avalanche]
   *                 description: Blockchain network
   *     responses:
   *       201:
   *         description: Wallet created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       409:
   *         description: Wallet address already exists
   */
  router.post('/wallets', controller.createWallet);

  /**
   * @swagger
   * /api/blockchain/wallets/{user_id}:
   *   get:
   *     summary: Get user wallets with details (Enhanced)
   *     description: Retrieves all wallets for a user with credential and NFT counts
   *     tags: [Blockchain - Wallets]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: User wallets with metadata
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 wallets:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       wallet_address:
   *                         type: string
   *                       blockchain_network:
   *                         type: string
   *                       credential_count:
   *                         type: integer
   *                       nft_count:
   *                         type: integer
   *                 count:
   *                   type: integer
   */
  router.get('/wallets/:user_id', controller.getWallets);

  /**
   * @swagger
   * /api/blockchain/wallets/verify:
   *   get:
   *     summary: Verify wallet ownership (NEW)
   *     description: Verifies if a user owns a specific wallet address
   *     tags: [Blockchain - Wallets]
   *     parameters:
   *       - in: query
   *         name: wallet_address
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Ownership verification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 wallet_address:
   *                   type: string
   *                 user_id:
   *                   type: string
   *                 is_owner:
   *                   type: boolean
   *                 verified_at:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Missing required parameters
   */
  router.get('/wallets/verify', controller.verifyWalletOwnership);

  // ========================================
  // VERIFIABLE CREDENTIALS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/blockchain/credentials:
   *   post:
   *     summary: Issue verifiable credential (Enhanced)
   *     description: Issues credential with validation and duplicate checking
   *     tags: [Blockchain - Credentials]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - credential_type
   *               - credential_name
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               credential_type:
   *                 type: string
   *                 enum: [certificate, badge, diploma, transcript, skill_verification]
   *                 description: Type of credential
   *               credential_name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Display name
   *                 example: "Full Stack Development Certificate"
   *               course_id:
   *                 type: string
   *                 format: uuid
   *                 description: Associated course (optional)
   *               blockchain_network:
   *                 type: string
   *                 enum: [ethereum, polygon, binance_smart_chain, solana, avalanche]
   *                 description: Target blockchain network (optional)
   *     responses:
   *       201:
   *         description: Credential issued successfully
   *       400:
   *         description: Validation error
   */
  router.post('/credentials', controller.issueCredential);

  /**
   * @swagger
   * /api/blockchain/credentials/{credential_id}:
   *   get:
   *     summary: Get credential by ID (Enhanced)
   *     description: Retrieves credential with validation
   *     tags: [Blockchain - Credentials]
   *     parameters:
   *       - in: path
   *         name: credential_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Credential details
   *       404:
   *         description: Credential not found
   */
  router.get('/credentials/:credential_id', controller.getCredentialById);

  /**
   * @swagger
   * /api/blockchain/credentials/{credential_id}/verify:
   *   get:
   *     summary: Verify credential (Enhanced)
   *     description: Verifies credential validity, checks expiry and revocation status
   *     tags: [Blockchain - Credentials]
   *     parameters:
   *       - in: path
   *         name: credential_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Verification result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 is_valid:
   *                   type: boolean
   *                 validation_message:
   *                   type: string
   *                 status:
   *                   type: string
   *                 expiry_date:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Credential not found
   */
  router.get('/credentials/:credential_id/verify', controller.verifyCredential);

  /**
   * @swagger
   * /api/blockchain/credentials/{credential_id}/revoke:
   *   post:
   *     summary: Revoke credential (NEW)
   *     description: Revokes credential with validation and logging
   *     tags: [Blockchain - Credentials]
   *     parameters:
   *       - in: path
   *         name: credential_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Reason for revocation
   *               revoked_by:
   *                 type: string
   *                 format: uuid
   *                 description: User who revoked the credential
   *     responses:
   *       200:
   *         description: Credential revoked successfully
   *       404:
   *         description: Credential not found
   *       422:
   *         description: Credential already revoked
   */
  router.post('/credentials/:credential_id/revoke', controller.revokeCredential);

  /**
   * @swagger
   * /api/blockchain/credentials/user/{user_id}/summary:
   *   get:
   *     summary: Get user credentials summary (NEW)
   *     description: Aggregated statistics of user credentials
   *     tags: [Blockchain - Credentials]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Credentials summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 summary:
   *                   type: object
   *                   properties:
   *                     total_credentials:
   *                       type: integer
   *                     active_credentials:
   *                       type: integer
   *                     revoked_credentials:
   *                       type: integer
   *                     certificates:
   *                       type: integer
   *                     badges:
   *                       type: integer
   *                     diplomas:
   *                       type: integer
   *                     networks:
   *                       type: array
   *                       items:
   *                         type: string
   */
  router.get('/credentials/user/:user_id/summary', controller.getUserCredentialsSummary);

  // ========================================
  // NFT CERTIFICATES - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/blockchain/nft/mint:
   *   post:
   *     summary: Mint NFT certificate (Enhanced)
   *     description: Initiates NFT minting with validation and duplicate checking
   *     tags: [Blockchain - NFT]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - certificate_id
   *               - blockchain_network
   *               - contract_address
   *               - token_id
   *               - nft_name
   *             properties:
   *               certificate_id:
   *                 type: string
   *                 format: uuid
   *                 description: Certificate UUID to mint as NFT
   *               blockchain_network:
   *                 type: string
   *                 enum: [ethereum, polygon, binance_smart_chain, solana, avalanche]
   *               contract_address:
   *                 type: string
   *                 minLength: 26
   *                 maxLength: 255
   *                 description: Smart contract address
   *               token_id:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Unique token ID on contract
   *               nft_name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: NFT display name
   *     responses:
   *       201:
   *         description: NFT mint initiated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 status:
   *                   type: string
   *                   example: pending
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       409:
   *         description: Token ID already exists
   */
  router.post('/nft/mint', controller.mintNFT);

  /**
   * @swagger
   * /api/blockchain/nft/{nft_id}/status:
   *   put:
   *     summary: Update NFT mint status (NEW)
   *     description: Updates NFT minting status (pending, minting, minted, failed)
   *     tags: [Blockchain - NFT]
   *     parameters:
   *       - in: path
   *         name: nft_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - mint_status
   *             properties:
   *               mint_status:
   *                 type: string
   *                 enum: [pending, minting, minted, failed]
   *               transaction_hash:
   *                 type: string
   *                 description: Blockchain transaction hash (when minted)
   *     responses:
   *       200:
   *         description: Status updated successfully
   *       400:
   *         description: Invalid status
   */
  router.put('/nft/:nft_id/status', controller.updateNFTMintStatus);

  /**
   * @swagger
   * /api/blockchain/nft:
   *   get:
   *     summary: Get NFT certificates (Enhanced)
   *     description: Retrieves NFT certificates with details from portfolio view
   *     tags: [Blockchain - NFT]
   *     parameters:
   *       - in: query
   *         name: user_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by user (optional)
   *     responses:
   *       200:
   *         description: List of NFT certificates
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 nfts:
   *                   type: array
   *                   items:
   *                     type: object
   *                 count:
   *                   type: integer
   */
  router.get('/nft', controller.getNFTs);

  // ========================================
  // BLOCKCHAIN TRANSACTIONS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/blockchain/transactions:
   *   post:
   *     summary: Record blockchain transaction (NEW)
   *     description: Records blockchain transaction with duplicate checking
   *     tags: [Blockchain - Transactions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - transaction_hash
   *               - blockchain_network
   *               - transaction_type
   *             properties:
   *               transaction_hash:
   *                 type: string
   *                 description: Unique transaction hash
   *               blockchain_network:
   *                 type: string
   *                 enum: [ethereum, polygon, binance_smart_chain, solana, avalanche]
   *               transaction_type:
   *                 type: string
   *                 description: Type of transaction (e.g., 'mint_nft', 'transfer', 'issue_credential')
   *               from_address:
   *                 type: string
   *               to_address:
   *                 type: string
   *               amount:
   *                 type: number
   *               gas_used:
   *                 type: number
   *     responses:
   *       201:
   *         description: Transaction recorded
   */
  router.post('/transactions', controller.recordTransaction);

  /**
   * @swagger
   * /api/blockchain/transactions:
   *   get:
   *     summary: Get blockchain transactions (Enhanced)
   *     description: Retrieves transactions with filtering options
   *     tags: [Blockchain - Transactions]
   *     parameters:
   *       - in: query
   *         name: blockchain_network
   *         schema:
   *           type: string
   *       - in: query
   *         name: transaction_type
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_address
   *         schema:
   *           type: string
   *         description: Filter by from_address or to_address
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *     responses:
   *       200:
   *         description: List of transactions
   */
  router.get('/transactions', controller.getTransactions);

  return router;
};
