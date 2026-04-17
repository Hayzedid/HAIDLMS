import { Router } from 'express';
import { BlockchainController } from '../controllers/blockchain.controller';
import { Pool } from 'pg';

export const createBlockchainRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new BlockchainController(pool);

  // Wallets
  router.post('/wallets', controller.createWallet);
  router.get('/wallets/:user_id', controller.getWallets);

  // Credentials
  router.post('/credentials', controller.issueCredential);
  router.get('/credentials', controller.getCredentials);
  router.get('/credentials/:credential_id/verify', controller.verifyCredential);

  // NFT Certificates
  router.post('/nft/mint', controller.mintNFT);
  router.get('/nft', controller.getNFTs);

  return router;
};
