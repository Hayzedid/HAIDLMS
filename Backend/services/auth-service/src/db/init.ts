import fs from 'fs';
import path from 'path';
import pool from './pool';

/**
 * Initialize database schema
 * Run: ts-node src/db/init.ts
 */
async function initDatabase() {
  try {
    console.log('[auth-service] Initializing database schema...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('[auth-service] ✅ Database schema initialized successfully');

    // Create a default admin user if none exists
    const adminCheck = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!@#';
      const passwordHash = await bcrypt.hash(defaultAdminPassword, 12);

      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_email_verified)
         VALUES ($1, $2, $3, $4, 'admin', true)`,
        ['admin@techlearn.com', passwordHash, 'Admin', 'User']
      );

      console.log('[auth-service] ✅ Default admin user created');
      console.log('   Email: admin@techlearn.com');
      console.log(`   Password: ${defaultAdminPassword}`);
      console.log('   ⚠️  Please change this password immediately!');
    }

    process.exit(0);
  } catch (error) {
    console.error('[auth-service] ❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
