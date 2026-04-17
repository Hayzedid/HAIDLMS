import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { cn } from '../../lib/utils';
export default function PricingPage() {
    const navigate = useNavigate();
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Perfect for getting started',
            price: {
                monthly: 0,
                annual: 0,
            },
            icon: _jsx(Sparkles, { className: "w-6 h-6" }),
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
            icon: _jsx(Zap, { className: "w-6 h-6" }),
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
            icon: _jsx(Crown, { className: "w-6 h-6" }),
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
    const handleSelectPlan = (planId) => {
        if (planId === 'free') {
            navigate('/register');
        }
        else {
            navigate(`/checkout?plan=${planId}&period=${billingPeriod}`);
        }
    };
    const getSavings = (plan) => {
        if (billingPeriod === 'annual' && plan.price.monthly > 0) {
            const monthlyCost = plan.price.monthly * 12;
            const annualCost = plan.price.annual;
            const savings = monthlyCost - annualCost;
            const percentage = Math.round((savings / monthlyCost) * 100);
            return { amount: savings, percentage };
        }
        return null;
    };
    return (_jsxs(AppLayout, { showFooter: true, children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold text-gray-900 mb-4", children: "Choose Your Learning Plan" }), _jsx("p", { className: "text-xl text-gray-600 mb-8 max-w-2xl mx-auto", children: "Start learning for free or unlock premium features with Pro" }), _jsxs("div", { className: "inline-flex items-center gap-3 p-1.5 bg-gray-100 rounded-lg", children: [_jsx("button", { onClick: () => setBillingPeriod('monthly'), className: cn('px-6 py-2.5 rounded-md font-medium transition-all', billingPeriod === 'monthly'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'), children: "Monthly" }), _jsxs("button", { onClick: () => setBillingPeriod('annual'), className: cn('px-6 py-2.5 rounded-md font-medium transition-all flex items-center gap-2', billingPeriod === 'annual'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'), children: ["Annual", _jsx(Badge, { variant: "success", className: "text-xs", children: "Save up to 17%" })] })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16", children: plans.map((plan) => {
                    const savings = getSavings(plan);
                    const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual;
                    const displayPrice = billingPeriod === 'annual' ? price / 12 : price;
                    return (_jsxs(Card, { className: cn('relative overflow-hidden transition-all hover:shadow-xl', plan.popular && 'ring-2 ring-primary-500 shadow-lg scale-105'), children: [plan.popular && (_jsx("div", { className: "absolute top-0 right-0 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg", children: "Most Popular" })), _jsxs(CardContent, { className: "p-8", children: [_jsx("div", { className: `w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg`, children: plan.icon }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: plan.name }), _jsx("p", { className: "text-gray-600 mb-6", children: plan.description }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-baseline gap-2", children: [_jsxs("span", { className: "text-5xl font-bold text-gray-900", children: ["$", displayPrice.toFixed(0)] }), _jsx("span", { className: "text-gray-600", children: "/month" })] }), billingPeriod === 'annual' && price > 0 && (_jsxs("p", { className: "text-sm text-gray-500 mt-2", children: ["$", price, " billed annually"] })), savings && (_jsxs(Badge, { variant: "success", className: "mt-2", children: ["Save $", savings.amount, " (", savings.percentage, "%)"] }))] }), _jsx(Button, { variant: plan.popular ? 'primary' : 'secondary', size: "lg", fullWidth: true, onClick: () => handleSelectPlan(plan.id), className: "mb-6", children: plan.id === 'free' ? 'Get Started' : 'Start Free Trial' }), _jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 mb-3", children: "What's included:" }), plan.features.map((feature, index) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Check, { className: "w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" }), _jsx("span", { className: "text-sm text-gray-700", children: feature })] }, index)))] })] })] }, plan.id));
                }) }), _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 text-center mb-12", children: "Frequently Asked Questions" }), _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Can I switch plans later?" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle." })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Is there a free trial?" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Yes, all paid plans come with a 7-day free trial. No credit card required to start." })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "What payment methods do you accept?" }), _jsx("p", { className: "text-gray-600 text-sm", children: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise customers." })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Can I cancel anytime?" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period." })] }) })] })] }), _jsxs("div", { className: "mt-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center text-white", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Need a custom solution?" }), _jsx("p", { className: "text-primary-100 text-lg mb-6 max-w-2xl mx-auto", children: "Contact our sales team to discuss enterprise plans, volume discounts, and custom integrations." }), _jsx(Button, { variant: "secondary", size: "lg", children: "Contact Sales" })] })] }));
}
