import fs from 'fs';
import path from 'path';
import pool from './pool';

/**
 * Initialize course service database schema
 * Run: ts-node src/db/init.ts
 */
async function initDatabase() {
  try {
    console.log('[course-service] Initializing database schema...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('[course-service] ✅ Database schema initialized successfully');

    // Create default categories
    const categories = [
      { name: 'Web Development', slug: 'web-development', description: 'Frontend, backend, and full-stack web development' },
      { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform mobile apps' },
      { name: 'Data Science', slug: 'data-science', description: 'Machine learning, AI, data analysis' },
      { name: 'DevOps', slug: 'devops', description: 'CI/CD, containerization, cloud infrastructure' },
      { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security fundamentals, penetration testing, secure coding' },
      { name: 'Cloud Computing', slug: 'cloud-computing', description: 'AWS, Azure, GCP, serverless' },
      { name: 'Database', slug: 'database', description: 'SQL, NoSQL, database design and optimization' },
      { name: 'Programming Languages', slug: 'programming-languages', description: 'Python, JavaScript, Java, Go, Rust, etc.' },
    ];

    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (name, slug, description, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.description, categories.indexOf(cat)]
      );
    }

    console.log('[course-service] ✅ Default categories created');

    process.exit(0);
  } catch (error) {
    console.error('[course-service] ❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
