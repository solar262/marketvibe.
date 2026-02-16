import { loadStripe } from '@stripe/stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_placeholder';
export const stripePromise = loadStripe(STRIPE_KEY);

const PAYMENT_LINKS = {
    founder: import.meta.env.VITE_STRIPE_FOUNDER_LINK || 'https://buy.stripe.com/14A5kD3L18dk3LA6Qq3ks00',
    expert: import.meta.env.VITE_STRIPE_EXPERT_LINK || 'https://buy.stripe.com/8x2dR96XdctA81Q8Yy3ks01'
};

export const createCheckoutSession = async (email, plan = 'founder') => {
    // DEBUG: Alert to see what's happening on mobile
    const envLink = import.meta.env[`VITE_STRIPE_${plan.toUpperCase()}_LINK`];
    const hardcodedLink = plan === 'founder'
        ? 'https://buy.stripe.com/14A5kD3L18dk3LA6Qq3ks00'
        : 'https://buy.stripe.com/8x2dR96XdctA81Q8Yy3ks01';

    const link = envLink || hardcodedLink;

    alert(`Debug: Plan=${plan}\nEnvLink=${envLink}\nFinalLink=${link}`);

    if (!link || link.includes('placeholder') || link.length < 10) {
        alert(`ERROR: Link validation failed for ${plan}`);
        throw new Error(`Stripe ${plan} configuration incomplete. Link is: ${link}`);
    }

    /*
    if (STRIPE_KEY.includes('placeholder')) {
         alert("ERROR: Stripe Key is placeholder");
         throw new Error(`Stripe Publishable Key missing.`);
    }
    */

    const checkoutUrl = `${link}?prefilled_email=${encodeURIComponent(email)}`;
    window.location.href = checkoutUrl;
};
