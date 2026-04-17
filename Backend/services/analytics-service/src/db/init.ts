import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/techlearn_analytics';

async function initializeDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔧 Initializing Analytics Service database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Database schema created successfully');

    // Create indexes for performance
    console.log('🔧 Creating additional performance indexes...');

    await pool.query(`
      -- Composite indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_events_user_type_created
        ON events(user_id, event_type, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_sessions_user_start_end
        ON learning_sessions(user_id, start_time, end_time);

      -- Partial indexes
      CREATE INDEX IF NOT EXISTS idx_sessions_active
        ON learning_sessions(user_id) WHERE status = 'active';

      CREATE INDEX IF NOT EXISTS idx_user_analytics_active
        ON user_analytics(user_id) WHERE last_active_at >= NOW() - INTERVAL '30 days';
    `);

    console.log('✅ Additional indexes created');

    // Initialize platform analytics
    await pool.query(`
      INSERT INTO platform_analytics (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Platform analytics initialized');

    console.log('\n✨ Analytics Service database initialization complete!\n');
    console.log('📊 Created tables:');
    console.log('  - events (raw event tracking)');
    console.log('  - learning_sessions (time tracking)');
    console.log('  - user_analytics (user metrics)');
    console.log('  - course_analytics (course metrics)');
    console.log('  - user_learning_metrics (detailed progress)');
    console.log('  - lesson_analytics (lesson metrics)');
    console.log('  - instructor_analytics (instructor metrics)');
    console.log('  - platform_analytics (platform-wide metrics)');
    console.log('  - daily_metrics_snapshot (historical data)');
    console.log('\n📈 Created materialized views:');
    console.log('  - mv_active_users_30d');
    console.log('  - mv_top_courses');
    console.log('  - mv_users_at_risk');
    console.log('\n⚡ Created helper functions:');
    console.log('  - calculate_engagement_score()');
    console.log('  - calculate_health_score()');
    console.log('  - refresh_analytics_views()');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeDatabase };
