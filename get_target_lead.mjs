import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getLead() {
    console.log("--- 🎯 GETTING TARGET LEAD ---");
    const { data, error } = await supabase
        .from('growth_leads')
        .select('*')
        .eq('username', 'zerozits')
        .limit(1)
        .single();

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

getLead();
