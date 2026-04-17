import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not set, database features will be disabled');
}

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  if (!connectionString) {
    return false;
  }

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

/**
 * Initialize database
 */
export async function initializeDatabase(): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}
