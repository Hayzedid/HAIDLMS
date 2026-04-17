import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { cn } from '../../lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: {
        monthly: 0,
        annual: 0,
      },
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-gray-400 to-gray-600',
      features: [
        'Access to free courses',
        'Basic code playground',
        'Community support',
        'Course completion certificates',
        'Limited AI tutor queries (5/month)',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For serious learners',
      price: {
        monthly: 29,
        annual: 290, // ~$24/month
      },
      popular: true,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-primary-500 to-primary-700',
      features: [
        'Everything in Free',
        'Unlimited course access',
        'Advanced code playground',
        'Priority support',
        'Downloadable resources',
        'Unlimited AI tutor queries',
        'Live proctored assessments',
        'Peer review system',
        'Learning health analytics',
        'Download certificates',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For teams and organizations',
      price: {
        monthly: 99,
        annual: 990, // ~$82.5/month
      },
      icon: <Crown className="w-6 h-6" />,
      color: 'from-accent-500 to-accent-700',
      features: [
        'Everything in Pro',
        'Team management dashboard',
        'Custom branding',
        'SSO integration',
        'Advanced analytics',
        'Dedicated account manager',
        'Priority support (24/7)',
        'Custom course creation',
        'API access',
        'Bulk licensing discounts',
      ],
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      navigate('/register');
    } else {
      navigate(`/checkout?plan=${planId}&period=${billingPeriod}`);
    }
  };

  const getSavings = (plan: Plan) => {
    if (billingPeriod === 'annual' && plan.price.monthly > 0) {
      const monthlyCost = plan.price.monthly * 12;
      const annualCost = plan.price.annual;
      const savings = monthlyCost - annualCost;
      const percentage = Math.round((savings / monthlyCost) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  return (
    <AppLayout showFooter={true}>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Choose Your Learning Plan
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Start learning for free or unlock premium features with Pro
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 bg-gray-100 rounded-lg">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-6 py-2.5 rounded-md font-medium transition-all',
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              'px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2',
              billingPeriod === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Annual
            <Badge variant="success" className="text-xs">
              Save up to 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => {
          const savings = getSavings(plan);
          const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual;
          const displayPrice = billingPeriod === 'annual' ? price / 12 : price;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative overflow-hidden transition-all hover:shadow-xl',
                plan.popular && 'ring-2 ring-primary-500 shadow-lg scale-105'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <CardContent className="p-8">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                  {plan.icon}
                </div>

                {/* Plan Name & Description */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${displayPrice.toFixed(0)}
                    </span>
                    <span className="text-gray-600">
                      /month
                    </span>
                  </div>
                  {billingPeriod === 'annual' && price > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ${price} billed annually
                    </p>
                  )}
                  {savings && (
                    <Badge variant="success" className="mt-2">
                      Save ${savings.amount} ({savings.percentage}%)
                    </Badge>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  variant={plan.popular ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => handleSelectPlan(plan.id)}
                  className="mb-6"
                >
                  {plan.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    What's included:
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, all paid plans come with a 7-day free trial. No credit card required to start.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise customers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Need a custom solution?
        </h2>
        <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
          Contact our sales team to discuss enterprise plans, volume discounts, and custom integrations.
        </p>
        <Button variant="secondary" size="lg">
          Contact Sales
        </Button>
      </div>
    </AppLayout>
  );
}
