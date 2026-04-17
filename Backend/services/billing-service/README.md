# Billing Service

Multi-gateway payment processing, subscription management, and revenue tracking for the TechLearn LMS platform.

## Features

- **Multi-Gateway Support**: Stripe, Paystack, Flutterwave
- **Subscription Management**: Full lifecycle (create, update, pause, cancel, renew)
- **Invoice Generation**: Automated PDF invoices with email delivery
- **Payment Methods**: Secure storage and management
- **Coupon System**: Percentage and fixed discounts with usage limits
- **Webhook Handlers**: Real-time payment event processing
- **Refund Processing**: Full and partial refund support
- **Revenue Analytics**: Materialized views for fast reporting
- **Transaction Logging**: Complete audit trail
- **Recurring Billing**: Automatic subscription renewals
- **Trial Periods**: Flexible trial configurations
- **Enterprise Billing**: Custom pricing and invoicing

## Tech Stack

- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Payment Gateways**:
  - Stripe (Global)
  - Paystack (Africa)
  - Flutterwave (Africa & Global)
- **PDF Generation**: PDFKit
- **Validation**: Zod

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Stripe account (for Stripe payments)
- Paystack account (for Paystack payments)
- Flutterwave account (for Flutterwave payments)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn_billing
JWT_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-...
```

### 3. Initialize Database

```bash
npm run db:init
```

This creates:
- 10 tables (subscriptions, transactions, invoices, payment_methods, coupons, refunds, etc.)
- 3 materialized views (active subscriptions, revenue by gateway, top customers)
- Helper functions (invoice numbering, MRR calculation, coupon validation)
- Default subscription plans (Free, Basic, Pro, Team, Enterprise)
- Sample coupons

### 4. Start Service

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  Pricing   │  │  Payment   │  │  Subscription      │  │
│  │  Page      │  │  Form      │  │  Management        │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬─────────────┘  │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼──────────────┐
│              Billing Service (Express)                      │
│  ┌───────────────────┐  ┌──────────────────────────────┐  │
│  │ Subscription      │  │  Invoice Service             │  │
│  │ Service           │  │  - Generation                │  │
│  │ - Create          │  │  - PDF Export                │  │
│  │ - Update          │  │  - Email Delivery            │  │
│  │ - Cancel          │  └──────────────────────────────┘  │
│  │ - Renew           │                                     │
│  └───────────────────┘  ┌──────────────────────────────┐  │
│                         │  Coupon Service              │  │
│  ┌───────────────────┐  │  - Validation                │  │
│  │ Webhook Service   │  │  - Redemption                │  │
│  │ - Stripe          │  │  - Analytics                 │  │
│  │ - Paystack        │  └──────────────────────────────┘  │
│  │ - Flutterwave     │                                     │
│  └───────────────────┘                                     │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────┐
│                  Payment Gateways                            │
│  ┌──────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │  Stripe  │  │  Paystack  │  │  Flutterwave           │  │
│  │  Service │  │  Service   │  │  Service               │  │
│  └──────────┘  └────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────┐
│                       PostgreSQL                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │Subscriptions │  │ Transactions  │  │   Invoices      │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   Coupons    │  │Payment Methods│  │   Refunds       │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

**subscription_plans** - Subscription plan definitions
- Free, Basic, Pro, Team, Enterprise tiers
- Monthly, yearly, lifetime billing cycles
- Feature limits and trial periods

**subscriptions** - Active subscriptions
- User subscription records
- Gateway integration details
- Billing periods and status

**transactions** - Payment transactions
- All payment records
- Multi-gateway support
- Refund tracking

**invoices** - Billing invoices
- Auto-generated invoices
- PDF export support
- Payment tracking

**payment_methods** - Stored payment methods
- Cards, bank accounts
- Multi-gateway support
- Default method selection

**coupons** - Discount coupons
- Percentage and fixed discounts
- Usage limits and expiration
- Plan/course restrictions

**refunds** - Refund records
- Full and partial refunds
- Gateway reconciliation

**webhook_events** - Webhook event log
- All gateway webhooks
- Retry mechanism
- Error tracking

**revenue_analytics** - Daily revenue metrics
- MRR (Monthly Recurring Revenue)
- Gateway fees
- Net revenue

### Materialized Views

**mv_active_subscriptions** - Active subscription summary
**mv_revenue_by_gateway** - Revenue breakdown by gateway
**mv_top_customers** - Top customers by revenue

## Subscription Plans

Default plans created on initialization:

| Plan | Price (Monthly) | Price (Yearly) | Features |
|------|----------------|----------------|----------|
| Free | $0 | - | 1 course, community support |
| Basic | $9.99 | - | 5 courses, email support, certificates |
| Pro | $19.99 | $191.90 (20% off) | Unlimited courses, priority support, analytics |
| Team | $49.99 | - | 10 users, team management, custom paths |
| Enterprise | $199.99 | - | Unlimited users, SSO, custom branding, API |
| Lifetime | $499.99 | - | One-time payment, lifetime access |

## Payment Gateways

### Stripe (Global)

**Best for**: US, Europe, Global markets

**Features**:
- Credit/debit cards
- ACH, SEPA, iDEAL
- Apple Pay, Google Pay
- Strong authentication (SCA)
- Subscription management
- Automatic tax calculation

**Setup**:
1. Create account at stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Set webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Add webhook secret to `.env`

### Paystack (Africa)

**Best for**: Nigeria, Ghana, Kenya, South Africa

**Features**:
- Cards (Visa, Mastercard)
- Mobile money (MTN, Vodafone)
- Bank transfers
- USSD payments
- Subscriptions

**Setup**:
1. Create account at paystack.com
2. Get API keys from Settings → API Keys
3. Set webhook URL: `https://yourdomain.com/api/webhooks/paystack`
4. Add secret key to `.env`

### Flutterwave (Africa & Global)

**Best for**: Nigeria, Ghana, Kenya, multiple African countries

**Features**:
- Multiple payment methods
- Mobile money
- Bank transfers
- International cards
- Multi-currency

**Setup**:
1. Create account at flutterwave.com
2. Get API keys from Settings → API
3. Set webhook URL: `https://yourdomain.com/api/webhooks/flutterwave`
4. Add keys to `.env`

## Usage

### Creating a Subscription

```typescript
import { subscriptionService } from './services/subscription.service';

const subscription = await subscriptionService.createSubscription({
  userId: 'user-uuid',
  planId: 'plan-uuid',
  gateway: 'stripe', // or 'paystack', 'flutterwave'
  paymentMethodId: 'pm_xxx',
  couponCode: 'SAVE10',
});
```

### Validating a Coupon

```typescript
import { couponService } from './services/coupon.service';

const validation = await couponService.validateCoupon(
  'SAVE10',
  'user-uuid',
  19.99
);

if (validation.valid) {
  console.log(`Discount: $${validation.discount}`);
}
```

### Generating an Invoice

```typescript
import { invoiceService } from './services/invoice.service';

const invoice = await invoiceService.createInvoice({
  userId: 'user-uuid',
  lineItems: [
    {
      description: 'Pro Plan - Monthly',
      quantity: 1,
      unitPrice: 19.99,
      amount: 19.99,
    },
  ],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

// Generate PDF
const pdfPath = await invoiceService.generateInvoicePDF(invoice.id);
```

### Handling Webhooks

Webhooks are automatically handled by the webhook service. Events processed:

**Stripe**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`

**Paystack**:
- `charge.success`
- `charge.failed`
- `subscription.create`
- `subscription.disable`
- `refund.processed`

**Flutterwave**:
- `charge.completed`
- `charge.failed`
- `subscription.cancelled`

## API Examples

### Subscription Management

```bash
# Create subscription
curl -X POST http://localhost:4007/api/subscriptions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "gateway": "stripe",
    "paymentMethodId": "pm_xxx",
    "couponCode": "SAVE10"
  }'

# Get user subscription
curl http://localhost:4007/api/subscriptions/me \
  -H "Authorization: Bearer TOKEN"

# Cancel subscription
curl -X DELETE http://localhost:4007/api/subscriptions/{id} \
  -H "Authorization: Bearer TOKEN"

# Resume subscription
curl -X POST http://localhost:4007/api/subscriptions/{id}/resume \
  -H "Authorization: Bearer TOKEN"
```

### Invoice Management

```bash
# Get user invoices
curl http://localhost:4007/api/invoices \
  -H "Authorization: Bearer TOKEN"

# Get invoice PDF
curl http://localhost:4007/api/invoices/{id}/pdf \
  -H "Authorization: Bearer TOKEN" \
  --output invoice.pdf

# Pay invoice
curl -X POST http://localhost:4007/api/invoices/{id}/pay \
  -H "Authorization: Bearer TOKEN" \
  -d '{"paymentMethodId": "pm_xxx"}'
```

### Coupon Validation

```bash
# Validate coupon
curl http://localhost:4007/api/coupons/validate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"code": "SAVE10", "amount": 19.99}'
```

## Testing

### Stripe Test Cards

```
# Success
4242 4242 4242 4242

# Requires authentication
4000 0027 6000 3184

# Declined
4000 0000 0000 0002
```

### Paystack Test Cards

```
# Success
5060 6666 6666 6666 666
CVV: 123, Expiry: Any future date, PIN: 1234

# Success (VISA)
4084 0840 8408 4081
CVV: 408, Expiry: Any future date, PIN: 1234
```

### Flutterwave Test Cards

```
# Success
5531 8866 5214 2950
CVV: 564, Expiry: 09/32, PIN: 3310, OTP: 12345
```

## Security Best Practices

### API Keys
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for test/production

### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement replay attack protection
- Log all webhook events

### PCI Compliance
- Never store raw card details
- Use gateway tokens/payment methods
- Implement proper access controls
- Regular security audits

### Database Security
- Encrypt sensitive data at rest
- Use prepared statements (prevent SQL injection)
- Implement row-level security
- Regular backups

## Monitoring

### Health Check

```http
GET /health
```

Returns database and service status.

### Metrics to Monitor

- **Transaction success rate**
- **Failed payment rate**
- **Subscription churn rate**
- **MRR (Monthly Recurring Revenue)**
- **Refund rate**
- **Gateway response times**
- **Webhook processing delays**

### Alerts to Set Up

- Failed webhook deliveries
- High failed payment rate
- Subscription cancellations spike
- Database connection issues
- Gateway API errors

## Troubleshooting

### Webhook Not Received

1. **Check webhook URL**: Ensure it's publicly accessible
2. **Verify signature**: Check signature verification logic
3. **Check logs**: Look for webhook errors in dashboard
4. **Test manually**: Use gateway dashboard to resend events

### Payment Failed

1. **Check gateway logs**: View detailed error messages
2. **Verify payment method**: Ensure card/account is valid
3. **Check limits**: Verify amount limits and restrictions
4. **Review 3DS**: Ensure 3D Secure is handled properly

### Subscription Not Renewing

1. **Check payment method**: Verify default payment method
2. **Review webhook logs**: Ensure renewal webhooks received
3. **Check grace period**: Review past_due grace settings
4. **Verify billing cycle**: Confirm period end dates

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure all gateway API keys (production)
- [ ] Set up webhook endpoints (HTTPS)
- [ ] Configure `JWT_SECRET`
- [ ] Set `DATABASE_URL` with connection pooling
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up monitoring (DataDog, Sentry)
- [ ] Configure log aggregation
- [ ] Set up alerts (PagerDuty)
- [ ] Database backups (daily)
- [ ] Test all payment flows
- [ ] Test webhook handlers
- [ ] Set up PCI compliance measures
- [ ] Document runbooks
- [ ] Train support team

### Scaling

**Horizontal Scaling**:
- Run multiple service instances
- Use load balancer
- Shared database with connection pooling
- Redis for distributed caching

**Database Optimization**:
- Regular VACUUM
- Index optimization
- Connection pooling (pgBouncer)
- Read replicas for reporting

**Webhook Processing**:
- Queue webhook events (Redis/RabbitMQ)
- Process async with workers
- Implement retry logic
- Monitor queue depth

## Support

For payment gateway specific issues:
- **Stripe**: support.stripe.com
- **Paystack**: support.paystack.com
- **Flutterwave**: support.flutterwave.com

For service issues:
- Check logs: `tail -f logs/billing.log`
- Database status: `psql $DATABASE_URL -c "SELECT NOW()"`
- Health check: `curl http://localhost:4007/health`

## License

Proprietary - TechLearn LMS Platform
