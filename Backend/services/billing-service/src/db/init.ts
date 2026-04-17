import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/techlearn_billing';

async function initializeDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔧 Initializing Billing Service database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Database schema created successfully');

    // Seed default subscription plans
    console.log('🌱 Seeding default subscription plans...');

    await pool.query(`
      INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, trial_days, features, max_courses, max_storage_gb, is_popular, sort_order)
      VALUES
        (
          'Free',
          'Perfect for trying out the platform',
          0.00,
          'USD',
          'monthly',
          0,
          '["Access to free courses", "Community support", "1 course enrollment"]',
          1,
          1,
          false,
          1
        ),
        (
          'Basic',
          'For individual learners',
          9.99,
          'USD',
          'monthly',
          14,
          '["Access to all courses", "Email support", "5 course enrollments", "Certificates", "Mobile access"]',
          5,
          5,
          false,
          2
        ),
        (
          'Pro',
          'For serious learners',
          19.99,
          'USD',
          'monthly',
          14,
          '["Everything in Basic", "Priority support", "Unlimited courses", "Offline downloads", "Advanced analytics", "1-on-1 mentorship sessions"]',
          NULL,
          20,
          true,
          3
        ),
        (
          'Team',
          'For small teams',
          49.99,
          'USD',
          'monthly',
          14,
          '["Everything in Pro", "Team management", "Up to 10 users", "Custom learning paths", "Team analytics", "Dedicated support"]',
          NULL,
          100,
          false,
          4
        ),
        (
          'Enterprise',
          'For organizations',
          199.99,
          'USD',
          'monthly',
          30,
          '["Everything in Team", "Unlimited users", "SSO integration", "Custom branding", "API access", "SLA guarantee", "Dedicated account manager"]',
          NULL,
          1000,
          false,
          5
        ),
        (
          'Pro Annual',
          'Save 20% with annual billing',
          191.90,
          'USD',
          'yearly',
          14,
          '["Everything in Pro", "20% discount", "Priority support", "Unlimited courses", "Offline downloads", "Advanced analytics", "1-on-1 mentorship sessions"]',
          NULL,
          20,
          true,
          6
        ),
        (
          'Lifetime',
          'One-time payment for lifetime access',
          499.99,
          'USD',
          'lifetime',
          0,
          '["Everything in Pro", "Lifetime access", "All future updates", "VIP support", "Exclusive community"]',
          NULL,
          50,
          false,
          7
        )
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Default subscription plans seeded');

    // Seed sample coupons
    console.log('🎟️  Seeding sample coupons...');

    await pool.query(`
      INSERT INTO coupons (code, name, description, discount_type, discount_value, max_uses, is_active)
      VALUES
        ('WELCOME10', 'Welcome 10% Off', 'First purchase discount', 'percentage', 10, NULL, true),
        ('SAVE50', '50% Off', 'Limited time offer', 'percentage', 50, 100, true),
        ('FREE30DAYS', 'Free 30 Days', 'Extended trial', 'percentage', 100, 50, true),
        ('STUDENT20', 'Student Discount', '20% off for students', 'percentage', 20, NULL, true)
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('✅ Sample coupons seeded');

    console.log('\n✨ Billing Service database initialization complete!\n');
    console.log('📊 Created tables:');
    console.log('  - subscription_plans (subscription plan definitions)');
    console.log('  - subscriptions (active subscriptions)');
    console.log('  - payment_methods (stored payment methods)');
    console.log('  - transactions (payment transactions)');
    console.log('  - invoices (billing invoices)');
    console.log('  - coupons (discount coupons)');
    console.log('  - coupon_redemptions (coupon usage tracking)');
    console.log('  - refunds (refund records)');
    console.log('  - webhook_events (webhook event log)');
    console.log('  - revenue_analytics (daily revenue metrics)');
    console.log('\n📈 Created materialized views:');
    console.log('  - mv_active_subscriptions');
    console.log('  - mv_revenue_by_gateway');
    console.log('  - mv_top_customers');
    console.log('\n⚡ Created helper functions:');
    console.log('  - generate_invoice_number()');
    console.log('  - calculate_mrr()');
    console.log('  - is_coupon_valid()');
    console.log('  - calculate_discount()');
    console.log('  - refresh_billing_views()');

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
