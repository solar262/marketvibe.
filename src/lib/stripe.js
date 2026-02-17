import { loadStripe } from '@stripe/stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_placeholder';
export const stripePromise = loadStripe(STRIPE_KEY);

const HARDCODED_LINKS = {
    founder: 'https://buy.stripe.com/14A5kD3L18dk3LA6Qq3ks00',
    expert: 'https://buy.stripe.com/8x2dR96XdctA81Q8Yy3ks01'
};

export const createCheckoutSession = async (email, plan = 'founder') => {
    // 1. Try to get link from environment
    const envVarName = `VITE_STRIPE_${plan.toUpperCase()}_LINK`;
    let link = import.meta.env[envVarName];

    // 2. If missing or placeholder, use hardcoded fallback
    if (!link || link.includes('placeholder') || link.length < 10) {
        console.warn(`[Stripe] Missing ${envVarName}, using hardcoded fallback.`);
        link = HARDCODED_LINKS[plan] || HARDCODED_LINKS.founder;
    }

    // 3. Final Validation
    if (!link || !link.startsWith('http')) {
        console.error(`[Stripe] Critical Error: No valid payment link for ${plan}. Link value: ${link}`);
        throw new Error(`Payment Configuration Error (Code 777). Please contact support.`);
    }

    // 4. Redirect
    const checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(email)}`;
    window.location.href = checkoutUrl;
};
