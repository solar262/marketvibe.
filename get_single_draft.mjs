import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getDraft() {
    console.log("--- 🎯 FETCHING DRAFT FOR @Dizzy_Artichoke_3365 ---\n");
    const { data, error } = await supabase
        .from('growth_leads')
        .select('*')
        .eq('username', 'Dizzy_Artichoke_3365')
        .limit(1)
        .single();

    if (error) {
        console.error("❌ Database Error:", error.message);
        return;
    }

    console.log("PLATFORM:", data.platform);
    console.log("DRAFT:", data.draft_reply);
    console.log("SCORE:", data.interest_score);
    console.log("NICHE:", data.niche);
    console.log("ID:", data.id);
}

getDraft();
