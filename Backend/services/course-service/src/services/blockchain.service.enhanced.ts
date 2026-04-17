import { Pool, PoolClient } from 'pg';
import {
  BlockchainWalletSchema,
  VerifiableCredentialSchema,
  NFTCertificateSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('BlockchainService');

export class BlockchainServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // BLOCKCHAIN WALLETS - ENHANCED
  // ========================================

  async createWalletWithValidation(data: any): Promise<string> {
    const startTime = Date.now();

    try {
      const validatedData = BlockchainWalletSchema.parse(data);
      logger.info('Creating blockchain wallet', {
        user_id: validatedData.user_id,
        blockchain_network: validatedData.blockchain_network
      });

      // Check for duplicate wallet address
      const existingWallet = await this.pool.query(
        `SELECT id FROM blockchain_wallets WHERE wallet_address = $1 AND blockchain_network = $2`,
        [validatedData.wallet_address, validatedData.blockchain_network]
      );

      if (existingWallet.rows.length > 0) {
        throw new ConflictError(`Wallet address already exists on ${validatedData.blockchain_network}`);
      }

      // Check if user already has wallet on this network
      const userWalletOnNetwork = await this.pool.query(
        `SELECT id FROM blockchain_wallets WHERE user_id = $1 AND blockchain_network = $2`,
        [validatedData.user_id, validatedData.blockchain_network]
      );

      if (userWalletOnNetwork.rows.length > 0) {
        logger.warn('User already has wallet on this network', {
          user_id: validatedData.user_id,
          blockchain_network: validatedData.blockchain_network
        });
      }

      const result = await this.pool.query(
        `INSERT INTO blockchain_wallets (user_id, wallet_address, blockchain_network)
         VALUES ($1, $2, $3) RETURNING id`,
        [validatedData.user_id, validatedData.wallet_address, validatedData.blockchain_network]
      );

      const duration = Date.now() - startTime;
      logger.info('Blockchain wallet created', {
        wallet_id: result.rows[0].id,
        duration: `${duration}ms`
      });

      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create blockchain wallet', error, { user_id: data.user_id });
      throw error;
    }
  }

  async getWalletsWithDetails(user_id: string): Promise<any[]> {
    try {
      logger.debug('Fetching user wallets', { user_id });

      const result = await this.pool.query(`
        SELECT
          bw.*,
          COUNT(vc.id) as credential_count,
          COUNT(nft.id) as nft_count
        FROM blockchain_wallets bw
        LEFT JOIN verifiable_credentials vc ON vc.user_id = bw.user_id AND vc.blockchain_network = bw.blockchain_network
        LEFT JOIN nft_certificates nft ON nft.certificate_id IN (
          SELECT certificate_id FROM certificates WHERE user_id = bw.user_id
        ) AND nft.blockchain_network = bw.blockchain_network
        WHERE bw.user_id = $1
        GROUP BY bw.id
        ORDER BY bw.created_at DESC
      `, [user_id]);

      logger.debug('User wallets retrieved', { user_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch user wallets', error, { user_id });
      throw error;
    }
  }

  async verifyWalletOwnership(wallet_address: string, user_id: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) > 0 as is_owner FROM blockchain_wallets
         WHERE wallet_address = $1 AND user_id = $2`,
        [wallet_address, user_id]
      );

      return result.rows[0].is_owner;
    } catch (error: any) {
      logger.error('Failed to verify wallet ownership', error, { wallet_address, user_id });
      throw error;
    }
  }

  // ========================================
  // VERIFIABLE CREDENTIALS - ENHANCED
  // ========================================

  async issueCredentialWithValidation(data: any): Promise<string> {
    const startTime = Date.now();

    try {
      const validatedData = VerifiableCredentialSchema.parse(data);
      logger.info('Issuing verifiable credential', {
        user_id: validatedData.user_id,
        credential_type: validatedData.credential_type,
        credential_name: validatedData.credential_name
      });

      // Check if user exists (optional validation)
      // In production, you might want to verify the user exists in your system

      // Check for existing credential
      const existingCredential = await this.pool.query(
        `SELECT id FROM verifiable_credentials
         WHERE user_id = $1 AND credential_type = $2 AND credential_name = $3 AND status = 'active'`,
        [validatedData.user_id, validatedData.credential_type, validatedData.credential_name]
      );

      if (existingCredential.rows.length > 0) {
        logger.warn('User already has this credential', {
          user_id: validatedData.user_id,
          credential_type: validatedData.credential_type
        });
        return existingCredential.rows[0].id;
      }

      const result = await this.pool.query(
        `SELECT issue_verifiable_credential($1, $2, $3, $4, $5) as id`,
        [
          validatedData.user_id,
          validatedData.credential_type,
          validatedData.credential_name,
          validatedData.course_id || null,
          validatedData.blockchain_network || null
        ]
      );

      const duration = Date.now() - startTime;
      logger.info('Verifiable credential issued', {
        credential_id: result.rows[0].id,
        duration: `${duration}ms`
      });

      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to issue verifiable credential', error, { user_id: data.user_id });
      throw error;
    }
  }

  async getCredentialByIdWithValidation(credential_id: string): Promise<any> {
    try {
      logger.debug('Fetching verifiable credential', { credential_id });

      const result = await this.pool.query(
        `SELECT * FROM verifiable_credentials WHERE id = $1`,
        [credential_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Verifiable credential', credential_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch verifiable credential', error, { credential_id });
      throw error;
    }
  }

  async verifyCredentialWithDetails(credential_id: string): Promise<any> {
    try {
      logger.info('Verifying credential', { credential_id });

      const result = await this.pool.query(`
        SELECT
          vc.*,
          CASE
            WHEN vc.status = 'revoked' THEN false
            WHEN vc.expiry_date IS NOT NULL AND vc.expiry_date < NOW() THEN false
            ELSE true
          END as is_valid,
          CASE
            WHEN vc.status = 'revoked' THEN 'Credential has been revoked'
            WHEN vc.expiry_date IS NOT NULL AND vc.expiry_date < NOW() THEN 'Credential has expired'
            ELSE 'Credential is valid'
          END as validation_message
        FROM verifiable_credentials vc
        WHERE vc.id = $1
      `, [credential_id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Verifiable credential', credential_id);
      }

      const credential = result.rows[0];

      logger.info('Credential verification complete', {
        credential_id,
        is_valid: credential.is_valid,
        status: credential.status
      });

      return credential;
    } catch (error: any) {
      logger.error('Failed to verify credential', error, { credential_id });
      throw error;
    }
  }

  async revokeCredentialWithValidation(credential_id: string, reason?: string, revoked_by?: string): Promise<void> {
    try {
      logger.warn('Revoking credential', { credential_id, reason, revoked_by });

      // Verify credential exists and is not already revoked
      const credential = await this.getCredentialByIdWithValidation(credential_id);

      if (credential.status === 'revoked') {
        throw new BusinessLogicError('Credential is already revoked');
      }

      await this.pool.query(
        `SELECT revoke_credential($1, $2)`,
        [credential_id, reason || null]
      );

      logger.info('Credential revoked successfully', { credential_id });
    } catch (error: any) {
      logger.error('Failed to revoke credential', error, { credential_id });
      throw error;
    }
  }

  async getUserCredentialsSummary(user_id: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT
          COUNT(*) as total_credentials,
          COUNT(*) FILTER (WHERE status = 'active') as active_credentials,
          COUNT(*) FILTER (WHERE status = 'revoked') as revoked_credentials,
          COUNT(*) FILTER (WHERE credential_type = 'certificate') as certificates,
          COUNT(*) FILTER (WHERE credential_type = 'badge') as badges,
          COUNT(*) FILTER (WHERE credential_type = 'diploma') as diplomas,
          ARRAY_AGG(DISTINCT blockchain_network) FILTER (WHERE blockchain_network IS NOT NULL) as networks
        FROM verifiable_credentials
        WHERE user_id = $1
      `, [user_id]);

      return result.rows[0] || {
        total_credentials: 0,
        active_credentials: 0,
        revoked_credentials: 0,
        certificates: 0,
        badges: 0,
        diplomas: 0,
        networks: []
      };
    } catch (error: any) {
      logger.error('Failed to get user credentials summary', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // NFT CERTIFICATES - ENHANCED
  // ========================================

  async mintNFTCertificateWithValidation(data: any): Promise<string> {
    try {
      const validatedData = NFTCertificateSchema.parse(data);
      logger.info('Minting NFT certificate', {
        certificate_id: validatedData.certificate_id,
        blockchain_network: validatedData.blockchain_network
      });

      // Check for duplicate token_id on same network
      const existingNFT = await this.pool.query(
        `SELECT id FROM nft_certificates
         WHERE blockchain_network = $1 AND contract_address = $2 AND token_id = $3`,
        [validatedData.blockchain_network, validatedData.contract_address, validatedData.token_id]
      );

      if (existingNFT.rows.length > 0) {
        throw new ConflictError(`NFT with token_id ${validatedData.token_id} already exists on this contract`);
      }

      return await this.withTransaction(async (client) => {
        const result = await client.query(
          `INSERT INTO nft_certificates (
            certificate_id, blockchain_network, nft_standard,
            contract_address, token_id, nft_name, mint_status
          ) VALUES ($1, $2, 'erc721', $3, $4, $5, 'pending')
          RETURNING id`,
          [
            validatedData.certificate_id,
            validatedData.blockchain_network,
            validatedData.contract_address,
            validatedData.token_id,
            validatedData.nft_name
          ]
        );

        logger.info('NFT certificate minted', { nft_id: result.rows[0].id });
        return result.rows[0].id;
      });
    } catch (error: any) {
      logger.error('Failed to mint NFT certificate', error);
      throw error;
    }
  }

  async updateNFTMintStatus(nft_id: string, mint_status: string, transaction_hash?: string): Promise<void> {
    try {
      const validStatuses = ['pending', 'minting', 'minted', 'failed'];
      if (!validStatuses.includes(mint_status)) {
        throw new ValidationError(`Invalid mint status. Must be one of: ${validStatuses.join(', ')}`);
      }

      logger.info('Updating NFT mint status', { nft_id, mint_status });

      const updates = [`mint_status = $1`, `updated_at = NOW()`];
      const values: any[] = [mint_status];
      let paramIndex = 2;

      if (transaction_hash) {
        updates.push(`transaction_hash = $${paramIndex++}`);
        values.push(transaction_hash);
      }

      if (mint_status === 'minted') {
        updates.push(`minted_at = NOW()`);
      }

      values.push(nft_id);

      await this.pool.query(
        `UPDATE nft_certificates SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      logger.info('NFT mint status updated', { nft_id, mint_status });
    } catch (error: any) {
      logger.error('Failed to update NFT mint status', error, { nft_id });
      throw error;
    }
  }

  async getNFTCertificatesWithDetails(user_id?: string): Promise<any[]> {
    try {
      const query = user_id
        ? `SELECT * FROM user_nft_portfolio WHERE user_id = $1 ORDER BY minted_at DESC`
        : `SELECT * FROM user_nft_portfolio ORDER BY minted_at DESC LIMIT 100`;

      const result = user_id
        ? await this.pool.query(query, [user_id])
        : await this.pool.query(query);

      logger.debug('NFT certificates retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch NFT certificates', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // BLOCKCHAIN TRANSACTIONS - ENHANCED
  // ========================================

  async recordTransactionWithValidation(data: {
    transaction_hash: string;
    blockchain_network: string;
    transaction_type: string;
    from_address?: string;
    to_address?: string;
    amount?: number;
    gas_used?: number;
  }): Promise<string> {
    try {
      logger.info('Recording blockchain transaction', {
        transaction_hash: data.transaction_hash,
        blockchain_network: data.blockchain_network,
        transaction_type: data.transaction_type
      });

      // Check for duplicate transaction hash
      const existingTx = await this.pool.query(
        `SELECT id FROM blockchain_transactions WHERE transaction_hash = $1`,
        [data.transaction_hash]
      );

      if (existingTx.rows.length > 0) {
        logger.warn('Transaction already recorded', { transaction_hash: data.transaction_hash });
        return existingTx.rows[0].id;
      }

      const result = await this.pool.query(
        `INSERT INTO blockchain_transactions (
          transaction_hash, blockchain_network, transaction_type,
          from_address, to_address, amount, gas_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          data.transaction_hash,
          data.blockchain_network,
          data.transaction_type,
          data.from_address || null,
          data.to_address || null,
          data.amount || null,
          data.gas_used || null
        ]
      );

      logger.info('Blockchain transaction recorded', { transaction_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to record blockchain transaction', error, { transaction_hash: data.transaction_hash });
      throw error;
    }
  }

  async getTransactionsWithFilters(filters?: {
    blockchain_network?: string;
    transaction_type?: string;
    user_address?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = `SELECT * FROM blockchain_transaction_history WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.blockchain_network) {
        query += ` AND blockchain_network = $${paramIndex++}`;
        values.push(filters.blockchain_network);
      }

      if (filters?.transaction_type) {
        query += ` AND transaction_type = $${paramIndex++}`;
        values.push(filters.transaction_type);
      }

      if (filters?.user_address) {
        query += ` AND (from_address = $${paramIndex} OR to_address = $${paramIndex})`;
        values.push(filters.user_address);
        paramIndex++;
      }

      const limit = filters?.limit || 100;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      values.push(limit);

      const result = await this.pool.query(query, values);

      logger.debug('Blockchain transactions retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch blockchain transactions', error, filters);
      throw error;
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getBlockchainHealthCheck(): Promise<any> {
    try {
      const [wallets, credentials, nfts, pendingNFTs] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM blockchain_wallets`),
        this.pool.query(`SELECT COUNT(*) as count FROM verifiable_credentials WHERE status = 'active'`),
        this.pool.query(`SELECT COUNT(*) as count FROM nft_certificates WHERE mint_status = 'minted'`),
        this.pool.query(`SELECT COUNT(*) as count FROM nft_certificates WHERE mint_status = 'pending'`)
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          total_wallets: parseInt(wallets.rows[0].count),
          active_credentials: parseInt(credentials.rows[0].count),
          minted_nfts: parseInt(nfts.rows[0].count),
          pending_nft_mints: parseInt(pendingNFTs.rows[0].count)
        },
        supported_networks: ['ethereum', 'polygon', 'binance_smart_chain', 'solana', 'avalanche']
      };
    } catch (error: any) {
      logger.error('Failed to get blockchain health check', error);
      throw error;
    }
  }
}
