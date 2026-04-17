import fs from 'fs';
import path from 'path';
import pool from './pool';

/**
 * Initialize IDE service database schema
 * Run: ts-node src/db/init.ts
 */
async function initDatabase() {
  try {
    console.log('[ide-service] Initializing database schema...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('[ide-service] ✅ Database schema initialized successfully');

    // Create some test templates for common languages
    const templates = [
      {
        lesson_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        language: 'python',
        starter_code: `# Write your code here\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
        solution_code: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
      },
      {
        lesson_id: '00000000-0000-0000-0000-000000000000',
        language: 'javascript',
        starter_code: `// Write your code here\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();`,
        solution_code: `function main() {\n  console.log("Hello, World!");\n}\n\nmain();`,
      },
    ];

    console.log('[ide-service] ℹ️  Sample templates can be added per lesson');

    process.exit(0);
  } catch (error) {
    console.error('[ide-service] ❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
