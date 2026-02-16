import { loadStripe } from '@stripe/stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_placeholder';
export const stripePromise = loadStripe(STRIPE_KEY);

const PAYMENT_LINKS = {
    founder: import.meta.env.VITE_STRIPE_FOUNDER_LINK || 'https://buy.stripe.com/14A5kD3L18dk3LA6Qq3ks00',
    expert: import.meta.env.VITE_STRIPE_EXPERT_LINK || 'https://buy.stripe.com/8x2dR96XdctA81Q8Yy3ks01'
};

export const createCheckoutSession = async (email, plan = 'founder') => {
    const link = PAYMENT_LINKS[plan];

    if (!link || link.includes('placeholder') || link.length < 10) {
        throw new Error(`Stripe ${plan} configuration incomplete. Please add your VITE_STRIPE_${plan.toUpperCase()}_LINK in the .env file.`);
    }

    if (STRIPE_KEY.includes('placeholder')) {
        throw new Error(`Stripe Publishable Key missing. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.`);
    }

    const checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(email)}`;
    window.location.href = checkoutUrl;
};
