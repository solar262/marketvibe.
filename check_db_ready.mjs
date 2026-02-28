import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    console.log("--- Checking launchpad_listings ---");
    const { data: lp } = await supabase.from('launchpad_listings').select('*').limit(1);
    console.log("LP Columns:", Object.keys(lp[0] || {}));

    console.log("\n--- Checking growth_leads ---");
    const { data: gl } = await supabase.from('growth_leads').select('*').limit(1);
    console.log("GL Columns:", Object.keys(gl[0] || {}));
}
check();
