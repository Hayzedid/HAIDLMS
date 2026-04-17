import { Request, Response } from 'express';
import { BlockchainServiceEnhanced } from '../services/blockchain.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('BlockchainController');

export class BlockchainControllerEnhanced {
  private blockchainService: BlockchainServiceEnhanced;

  constructor(pool: Pool) {
    this.blockchainService = new BlockchainServiceEnhanced(pool);
  }

  // ========================================
  // ERROR HANDLER
  // ========================================

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);

    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });

    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  // ========================================
  // BLOCKCHAIN WALLETS - ENHANCED
  // ========================================

  createWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/blockchain/wallets', req.body.user_id);

      const walletId = await this.blockchainService.createWalletWithValidation(req.body);

      res.status(201).json({
        id: walletId,
        message: 'Blockchain wallet created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create wallet');
    }
  };

  getWallets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;

      const wallets = await this.blockchainService.getWalletsWithDetails(user_id);

      res.json({
        user_id,
        wallets,
        count: wallets.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get wallets');
    }
  };

  verifyWalletOwnership = async (req: Request, res: Response): Promise<void> => {
    try {
      const { wallet_address, user_id } = req.query;

      if (!wallet_address || !user_id) {
        res.status(400).json({ error: 'wallet_address and user_id are required' });
        return;
      }

      const isOwner = await this.blockchainService.verifyWalletOwnership(
        wallet_address as string,
        user_id as string
      );

      res.json({
        wallet_address,
        user_id,
        is_owner: isOwner,
        verified_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Verify wallet ownership');
    }
  };

  // ========================================
  // VERIFIABLE CREDENTIALS - ENHANCED
  // ========================================

  issueCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/blockchain/credentials', req.body.user_id);

      const credentialId = await this.blockchainService.issueCredentialWithValidation(req.body);

      res.status(201).json({
        id: credentialId,
        message: 'Verifiable credential issued successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Issue credential');
    }
  };

  getCredentialById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential_id } = req.params;

      const credential = await this.blockchainService.getCredentialByIdWithValidation(credential_id);

      res.json(credential);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get credential');
    }
  };

  verifyCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential_id } = req.params;

      const verification = await this.blockchainService.verifyCredentialWithDetails(credential_id);

      res.json(verification);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Verify credential');
    }
  };

  revokeCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential_id } = req.params;
      const { reason, revoked_by } = req.body;

      await this.blockchainService.revokeCredentialWithValidation(credential_id, reason, revoked_by);

      res.json({
        message: 'Credential revoked successfully',
        credential_id,
        revoked_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Revoke credential');
    }
  };

  getUserCredentialsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;

      const summary = await this.blockchainService.getUserCredentialsSummary(user_id);

      res.json({
        user_id,
        summary
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get user credentials summary');
    }
  };

  // ========================================
  // NFT CERTIFICATES - ENHANCED
  // ========================================

  mintNFT = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/blockchain/nfts/mint');

      const nftId = await this.blockchainService.mintNFTCertificateWithValidation(req.body);

      res.status(201).json({
        id: nftId,
        status: 'pending',
        message: 'NFT certificate mint initiated'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Mint NFT');
    }
  };

  updateNFTMintStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nft_id } = req.params;
      const { mint_status, transaction_hash } = req.body;

      if (!mint_status) {
        res.status(400).json({ error: 'mint_status is required' });
        return;
      }

      await this.blockchainService.updateNFTMintStatus(nft_id, mint_status, transaction_hash);

      res.json({
        message: 'NFT mint status updated',
        nft_id,
        mint_status
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update NFT mint status');
    }
  };

  getNFTs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.query;

      const nfts = await this.blockchainService.getNFTCertificatesWithDetails(user_id as string);

      res.json({
        nfts,
        count: nfts.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get NFTs');
    }
  };

  // ========================================
  // BLOCKCHAIN TRANSACTIONS - ENHANCED
  // ========================================

  recordTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const transactionId = await this.blockchainService.recordTransactionWithValidation(req.body);

      res.status(201).json({
        id: transactionId,
        message: 'Blockchain transaction recorded'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record transaction');
    }
  };

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { blockchain_network, transaction_type, user_address, limit } = req.query;

      const transactions = await this.blockchainService.getTransactionsWithFilters({
        blockchain_network: blockchain_network as string,
        transaction_type: transaction_type as string,
        user_address: user_address as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        transactions,
        count: transactions.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get transactions');
    }
  };

  // ========================================
  // HEALTH CHECK
  // ========================================

  blockchainHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.blockchainService.getBlockchainHealthCheck();

      res.json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Blockchain health check');
    }
  };
}
