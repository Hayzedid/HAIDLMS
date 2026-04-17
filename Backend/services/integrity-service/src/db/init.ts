import { initializeDatabase, testConnection, pool } from './pool';

async function init() {
  console.log('Initializing Integrity Service Database...\n');

  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  await initializeDatabase();

  console.log('\n✓ Integrity Service database ready!\n');

  await pool.end();
  process.exit(0);
}

init();
