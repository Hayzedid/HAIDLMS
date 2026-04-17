import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import { Pool } from 'pg';

export class BlockchainController {
  private blockchainService: BlockchainService;

  constructor(pool: Pool) {
    this.blockchainService = new BlockchainService(pool);
  }

  createWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.blockchainService.createWallet(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  };

  getWallets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const wallets = await this.blockchainService.getWallets(user_id);
      res.json({ wallets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  };

  issueCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.blockchainService.issueCredential(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to issue credential' });
    }
  };

  getCredentials = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.query;
      const credentials = await this.blockchainService.getCredentials(user_id as string);
      res.json({ credentials });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  };

  verifyCredential = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential_id } = req.params;
      const verification = await this.blockchainService.verifyCredential(credential_id);
      res.json(verification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify credential' });
    }
  };

  mintNFT = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.blockchainService.mintNFTCertificate(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mint NFT' });
    }
  };

  getNFTs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.query;
      const nfts = await this.blockchainService.getNFTCertificates(user_id as string);
      res.json({ nfts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
  };
}
