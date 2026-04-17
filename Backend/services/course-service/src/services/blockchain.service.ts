import { Pool } from 'pg';

export class BlockchainService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Blockchain Wallets
  async createWallet(data: { user_id: string; wallet_address: string; blockchain_network: string; }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO blockchain_wallets (user_id, wallet_address, blockchain_network) VALUES ($1, $2, $3) RETURNING id`,
      [data.user_id, data.wallet_address, data.blockchain_network]
    );
    return result.rows[0].id;
  }

  async getWallets(user_id: string): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM blockchain_wallets WHERE user_id = $1`, [user_id]);
    return result.rows;
  }

  // Verifiable Credentials
  async issueCredential(data: {
    user_id: string;
    credential_type: string;
    credential_name: string;
    course_id?: string;
    blockchain_network?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `SELECT issue_verifiable_credential($1, $2, $3, $4, $5) as id`,
      [data.user_id, data.credential_type, data.credential_name, data.course_id || null, data.blockchain_network || null]
    );
    return result.rows[0].id;
  }

  async getCredentials(user_id?: string): Promise<any[]> {
    const query = user_id
      ? `SELECT * FROM verifiable_credentials WHERE user_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM verifiable_credentials ORDER BY created_at DESC LIMIT 100`;
    const result = user_id ? await this.pool.query(query, [user_id]) : await this.pool.query(query);
    return result.rows;
  }

  async verifyCredential(credential_id: string): Promise<any> {
    const result = await this.pool.query(`SELECT * FROM verify_credential($1)`, [credential_id]);
    return result.rows[0];
  }

  async revokeCredential(credential_id: string, reason?: string): Promise<void> {
    await this.pool.query(`SELECT revoke_credential($1, $2)`, [credential_id, reason || null]);
  }

  // NFT Certificates
  async mintNFTCertificate(data: {
    certificate_id: string;
    blockchain_network: string;
    contract_address: string;
    token_id: string;
    nft_name: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO nft_certificates (certificate_id, blockchain_network, nft_standard, contract_address, token_id, nft_name)
       VALUES ($1, $2, 'erc721', $3, $4, $5) RETURNING id`,
      [data.certificate_id, data.blockchain_network, data.contract_address, data.token_id, data.nft_name]
    );
    return result.rows[0].id;
  }

  async getNFTCertificates(user_id?: string): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM user_nft_portfolio WHERE user_id = $1 OR $1 IS NULL`, [user_id || null]);
    return result.rows;
  }

  // Blockchain Transactions
  async recordTransaction(data: {
    transaction_hash: string;
    blockchain_network: string;
    transaction_type: string;
    from_address?: string;
    to_address?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO blockchain_transactions (transaction_hash, blockchain_network, transaction_type, from_address, to_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.transaction_hash, data.blockchain_network, data.transaction_type, data.from_address || null, data.to_address || null]
    );
    return result.rows[0].id;
  }

  async getTransactions(filters?: { blockchain_network?: string; transaction_type?: string; }): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM blockchain_transaction_history LIMIT 100`);
    return result.rows;
  }
}
