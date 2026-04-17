-- Blockchain Credentials & NFT Certificates Schema
-- Verifiable credentials, NFT certificates, blockchain verification, Web3 integration

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE blockchain_network AS ENUM ('ethereum', 'polygon', 'binance_smart_chain', 'solana', 'avalanche');
CREATE TYPE credential_type AS ENUM ('certificate', 'badge', 'diploma', 'transcript', 'skill_verification');
CREATE TYPE credential_status AS ENUM ('pending', 'issued', 'revoked', 'expired', 'suspended');
CREATE TYPE verification_method AS ENUM ('blockchain', 'did', 'centralized', 'hybrid');
CREATE TYPE nft_standard AS ENUM ('erc721', 'erc1155', 'spl_token', 'custom');

-- ========================================
-- 2. BLOCKCHAIN WALLETS
-- ========================================

CREATE TABLE IF NOT EXISTS blockchain_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Wallet Details
  wallet_address VARCHAR(255) NOT NULL,
  blockchain_network blockchain_network NOT NULL,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verification_signature TEXT,

  -- Primary Wallet
  is_primary BOOLEAN DEFAULT false,

  -- Metadata
  wallet_name VARCHAR(255),
  ens_domain VARCHAR(255), -- ENS or other naming service

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_wallet_address UNIQUE (wallet_address, blockchain_network)
);

CREATE INDEX idx_wallets_user ON blockchain_wallets(user_id);
CREATE INDEX idx_wallets_address ON blockchain_wallets(wallet_address);
CREATE INDEX idx_wallets_network ON blockchain_wallets(blockchain_network);
CREATE INDEX idx_wallets_primary ON blockchain_wallets(is_primary) WHERE is_primary = true;

-- ========================================
-- 3. VERIFIABLE CREDENTIALS
-- ========================================

CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Credential Identity
  credential_id VARCHAR(255) NOT NULL UNIQUE, -- DID or unique identifier
  credential_type credential_type NOT NULL,

  -- Holder
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holder_did VARCHAR(500), -- Decentralized Identifier

  -- Issuer
  issuer_did VARCHAR(500) NOT NULL,
  issuer_name VARCHAR(255),
  issuer_organization VARCHAR(255),

  -- Credential Details
  credential_name VARCHAR(255) NOT NULL,
  credential_description TEXT,
  achievement_description TEXT,

  -- Course Integration
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,

  -- Credential Subject
  credential_subject JSONB NOT NULL, -- W3C Verifiable Credential format

  -- Verification Method
  verification_method verification_method NOT NULL,

  -- Blockchain Details
  blockchain_network blockchain_network,
  contract_address VARCHAR(255),
  token_id VARCHAR(255),
  transaction_hash VARCHAR(255),

  -- Proof
  proof JSONB, -- Cryptographic proof
  signature TEXT,
  signature_algorithm VARCHAR(100),

  -- Status
  status credential_status DEFAULT 'pending',
  issued_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,

  -- Metadata
  metadata JSONB,
  skills TEXT[],
  competencies JSONB,

  -- W3C Verifiable Credential (full JSON-LD)
  vc_document JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credentials_id ON verifiable_credentials(credential_id);
CREATE INDEX idx_credentials_user ON verifiable_credentials(user_id);
CREATE INDEX idx_credentials_type ON verifiable_credentials(credential_type);
CREATE INDEX idx_credentials_status ON verifiable_credentials(status);
CREATE INDEX idx_credentials_course ON verifiable_credentials(course_id);
CREATE INDEX idx_credentials_blockchain ON verifiable_credentials(blockchain_network, contract_address, token_id);

-- ========================================
-- 4. NFT CERTIFICATES
-- ========================================

CREATE TABLE IF NOT EXISTS nft_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Certificate Reference
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  verifiable_credential_id UUID REFERENCES verifiable_credentials(id) ON DELETE SET NULL,

  -- NFT Details
  nft_name VARCHAR(255) NOT NULL,
  nft_description TEXT,
  nft_image_url VARCHAR(1000),
  nft_animation_url VARCHAR(1000),
  nft_external_url VARCHAR(1000),

  -- Blockchain
  blockchain_network blockchain_network NOT NULL,
  nft_standard nft_standard NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  token_id VARCHAR(255) NOT NULL,

  -- Minting
  mint_transaction_hash VARCHAR(255),
  minted_at TIMESTAMP,
  minted_to_address VARCHAR(255),
  gas_fee_paid NUMERIC,

  -- Ownership
  current_owner_address VARCHAR(255),
  current_owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata URI
  metadata_uri VARCHAR(1000), -- IPFS or other decentralized storage
  metadata_json JSONB, -- NFT metadata (ERC-721/1155 standard)

  -- Attributes
  attributes JSONB, -- NFT traits/attributes

  -- Royalties
  royalty_percentage NUMERIC,
  creator_address VARCHAR(255),

  -- Status
  is_minted BOOLEAN DEFAULT false,
  is_transferable BOOLEAN DEFAULT true,
  is_burnable BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_nft UNIQUE (blockchain_network, contract_address, token_id)
);

CREATE INDEX idx_nft_certificates_cert ON nft_certificates(certificate_id);
CREATE INDEX idx_nft_certificates_credential ON nft_certificates(verifiable_credential_id);
CREATE INDEX idx_nft_certificates_network ON nft_certificates(blockchain_network);
CREATE INDEX idx_nft_certificates_token ON nft_certificates(contract_address, token_id);
CREATE INDEX idx_nft_certificates_owner ON nft_certificates(current_owner_address);

-- ========================================
-- 5. BLOCKCHAIN TRANSACTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Transaction Details
  transaction_hash VARCHAR(255) NOT NULL,
  blockchain_network blockchain_network NOT NULL,

  -- Type
  transaction_type VARCHAR(100) NOT NULL, -- 'mint', 'transfer', 'burn', 'revoke'

  -- References
  verifiable_credential_id UUID REFERENCES verifiable_credentials(id) ON DELETE SET NULL,
  nft_certificate_id UUID REFERENCES nft_certificates(id) ON DELETE SET NULL,

  -- Addresses
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  contract_address VARCHAR(255),

  -- Transaction Data
  block_number BIGINT,
  block_timestamp TIMESTAMP,
  gas_used BIGINT,
  gas_price NUMERIC,
  transaction_fee NUMERIC,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  confirmations INTEGER DEFAULT 0,
  error_message TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_transaction UNIQUE (transaction_hash, blockchain_network)
);

CREATE INDEX idx_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_transactions_network ON blockchain_transactions(blockchain_network);
CREATE INDEX idx_transactions_credential ON blockchain_transactions(verifiable_credential_id);
CREATE INDEX idx_transactions_nft ON blockchain_transactions(nft_certificate_id);
CREATE INDEX idx_transactions_status ON blockchain_transactions(status);

-- ========================================
-- 6. CREDENTIAL VERIFICATION REQUESTS
-- ========================================

CREATE TABLE IF NOT EXISTS credential_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Credential
  verifiable_credential_id UUID NOT NULL REFERENCES verifiable_credentials(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) NOT NULL,

  -- Verifier
  verifier_name VARCHAR(255),
  verifier_organization VARCHAR(255),
  verifier_email VARCHAR(255),
  verifier_did VARCHAR(500),

  -- Verification Details
  verification_method verification_method NOT NULL,
  verification_result VARCHAR(50), -- 'valid', 'invalid', 'revoked', 'expired'
  verification_timestamp TIMESTAMP DEFAULT NOW(),

  -- Blockchain Verification
  blockchain_verified BOOLEAN DEFAULT false,
  blockchain_verification_data JSONB,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  verification_purpose TEXT,

  -- Result Details
  verification_details JSONB,
  errors TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verifications_credential ON credential_verifications(verifiable_credential_id);
CREATE INDEX idx_verifications_result ON credential_verifications(verification_result);
CREATE INDEX idx_verifications_timestamp ON credential_verifications(verification_timestamp DESC);

-- ========================================
-- 7. SMART CONTRACT DEPLOYMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS smart_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contract Details
  contract_name VARCHAR(255) NOT NULL,
  contract_description TEXT,
  contract_type VARCHAR(100) NOT NULL, -- 'certificate', 'badge', 'credential_registry'

  -- Blockchain
  blockchain_network blockchain_network NOT NULL,
  contract_address VARCHAR(255) NOT NULL,

  -- Deployment
  deployer_address VARCHAR(255),
  deployment_transaction_hash VARCHAR(255),
  deployed_at TIMESTAMP,
  block_number BIGINT,

  -- Contract Code
  contract_source_code TEXT,
  contract_abi JSONB,
  compiler_version VARCHAR(100),

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_on_explorer BOOLEAN DEFAULT false,
  explorer_url VARCHAR(1000),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_upgradeable BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_contract UNIQUE (blockchain_network, contract_address)
);

CREATE INDEX idx_contracts_network ON smart_contracts(blockchain_network);
CREATE INDEX idx_contracts_address ON smart_contracts(contract_address);
CREATE INDEX idx_contracts_type ON smart_contracts(contract_type);
CREATE INDEX idx_contracts_active ON smart_contracts(is_active);

-- ========================================
-- 8. CREDENTIAL PRESENTATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS credential_presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Presentation Identity
  presentation_id VARCHAR(255) NOT NULL UNIQUE,

  -- Holder
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  holder_did VARCHAR(500),

  -- Credentials Included
  credential_ids UUID[] NOT NULL,

  -- Verifier
  verifier_name VARCHAR(255),
  verifier_did VARCHAR(500),
  challenge VARCHAR(500), -- Presentation challenge
  domain VARCHAR(500),

  -- Presentation
  presentation_data JSONB NOT NULL, -- W3C Verifiable Presentation format
  proof JSONB,

  -- Purpose
  presentation_purpose TEXT,

  -- Status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,

  -- Expiration
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_presentations_id ON credential_presentations(presentation_id);
CREATE INDEX idx_presentations_user ON credential_presentations(user_id);
CREATE INDEX idx_presentations_verified ON credential_presentations(is_verified);

-- ========================================
-- 9. DECENTRALIZED IDENTIFIERS (DIDs)
-- ========================================

CREATE TABLE IF NOT EXISTS decentralized_identifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- DID
  did VARCHAR(500) NOT NULL UNIQUE,
  did_method VARCHAR(100) NOT NULL, -- 'key', 'web', 'ethr', etc.

  -- DID Document
  did_document JSONB NOT NULL,

  -- Keys
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT, -- Encrypted private key
  key_type VARCHAR(100), -- 'Ed25519', 'secp256k1', etc.

  -- Verification Methods
  verification_methods JSONB,
  authentication_methods JSONB,

  -- Services
  service_endpoints JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false, -- Published to DID registry

  -- Blockchain
  blockchain_network blockchain_network,
  registry_address VARCHAR(255),
  registration_transaction_hash VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dids_user ON decentralized_identifiers(user_id);
CREATE INDEX idx_dids_did ON decentralized_identifiers(did);
CREATE INDEX idx_dids_method ON decentralized_identifiers(did_method);

-- ========================================
-- 10. CREDENTIAL SCHEMAS
-- ========================================

CREATE TABLE IF NOT EXISTS credential_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Schema Identity
  schema_id VARCHAR(500) NOT NULL UNIQUE,
  schema_name VARCHAR(255) NOT NULL,
  schema_description TEXT,

  -- Type
  credential_type credential_type NOT NULL,

  -- Schema Definition
  schema_version VARCHAR(50) NOT NULL,
  schema_definition JSONB NOT NULL, -- JSON Schema

  -- W3C Context
  context_urls TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,

  -- Issuer
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schemas_id ON credential_schemas(schema_id);
CREATE INDEX idx_schemas_type ON credential_schemas(credential_type);
CREATE INDEX idx_schemas_active ON credential_schemas(is_active);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Issue verifiable credential
CREATE OR REPLACE FUNCTION issue_verifiable_credential(
  p_user_id UUID,
  p_credential_type credential_type,
  p_credential_name VARCHAR,
  p_course_id UUID DEFAULT NULL,
  p_blockchain_network blockchain_network DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
  v_did_suffix VARCHAR;
BEGIN
  -- Generate unique credential ID
  v_did_suffix := encode(gen_random_bytes(16), 'hex');

  INSERT INTO verifiable_credentials (
    credential_id,
    credential_type,
    user_id,
    credential_name,
    issuer_did,
    issuer_name,
    verification_method,
    blockchain_network,
    credential_subject,
    vc_document,
    status
  ) VALUES (
    'did:haid:credential:' || v_did_suffix,
    p_credential_type,
    p_user_id,
    p_credential_name,
    'did:haid:issuer:main',
    'HAID LMS',
    CASE WHEN p_blockchain_network IS NULL THEN 'centralized' ELSE 'blockchain' END,
    p_blockchain_network,
    jsonb_build_object('id', 'did:haid:user:' || p_user_id, 'achievement', p_credential_name),
    jsonb_build_object('@context', ARRAY['https://www.w3.org/2018/credentials/v1']),
    'pending'
  )
  RETURNING id INTO v_credential_id;

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Verify credential
CREATE OR REPLACE FUNCTION verify_credential(
  p_credential_id VARCHAR,
  p_verifier_name VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  status VARCHAR,
  message TEXT
) AS $$
DECLARE
  v_credential RECORD;
BEGIN
  SELECT * INTO v_credential
  FROM verifiable_credentials
  WHERE credential_id = p_credential_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::VARCHAR, 'Credential not found'::TEXT;
    RETURN;
  END IF;

  IF v_credential.status = 'revoked' THEN
    RETURN QUERY SELECT false, 'revoked'::VARCHAR, 'Credential has been revoked'::TEXT;
    RETURN;
  END IF;

  IF v_credential.expires_at IS NOT NULL AND v_credential.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'expired'::VARCHAR, 'Credential has expired'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'valid'::VARCHAR, 'Credential is valid'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function: Revoke credential
CREATE OR REPLACE FUNCTION revoke_credential(
  p_credential_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE verifiable_credentials
  SET
    status = 'revoked',
    revoked_at = NOW(),
    revocation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_credential_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. VIEWS
-- ========================================

-- View: User credentials summary
CREATE OR REPLACE VIEW user_credentials_summary AS
SELECT
  user_id,
  COUNT(*) AS total_credentials,
  COUNT(*) FILTER (WHERE status = 'issued') AS issued_credentials,
  COUNT(*) FILTER (WHERE blockchain_network IS NOT NULL) AS blockchain_credentials,
  array_agg(DISTINCT credential_type) AS credential_types
FROM verifiable_credentials
GROUP BY user_id;

-- View: NFT portfolio
CREATE OR REPLACE VIEW user_nft_portfolio AS
SELECT
  u.id AS user_id,
  u.full_name,
  nc.nft_name,
  nc.blockchain_network,
  nc.token_id,
  nc.current_owner_address,
  nc.minted_at,
  c.title AS certificate_title
FROM nft_certificates nc
LEFT JOIN certificates c ON nc.certificate_id = c.id
LEFT JOIN users u ON nc.current_owner_user_id = u.id
WHERE nc.is_minted = true;

-- View: Blockchain transaction history
CREATE OR REPLACE VIEW blockchain_transaction_history AS
SELECT
  bt.transaction_hash,
  bt.blockchain_network,
  bt.transaction_type,
  bt.block_timestamp,
  bt.transaction_fee,
  bt.status,
  vc.credential_name,
  u.full_name AS user_name
FROM blockchain_transactions bt
LEFT JOIN verifiable_credentials vc ON bt.verifiable_credential_id = vc.id
LEFT JOIN users u ON vc.user_id = u.id
ORDER BY bt.block_timestamp DESC;

COMMENT ON SCHEMA public IS 'Blockchain Credentials & NFT Certificates - Web3 verifiable credentials and NFT certificates';
