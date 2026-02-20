import { spawn } from 'child_process';
import path from 'path';

/**
 * 🚀 MarketVibe Revenue Engine (Engineering Edition)
 * Orchestrates all autonomous agents in parallel to drive lead generation, 
 * closer-mode sales, and nurture drips.
 */

const SCRIPTS = [
    { name: 'SENTINEL (Lead Finder)', path: 'outreach_agent.mjs', interval: 15 * 60 * 1000 }, // Every 15 mins
    { name: 'THE CLOSER (High Ticket Sales)', path: 'closer_autopilot.mjs', interval: 30 * 60 * 1000 }, // Every 30 mins
    { name: 'THE HERALD (Engagement)', path: 'herald_worker.mjs', interval: 5 * 60 * 1000 }, // Every 5 mins
    { name: 'THE NURTURER (Email Drip)', path: 'nurture_worker.mjs', interval: 60 * 60 * 1000 } // Every 1 hour
];

function runScript(script) {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Initiating ${script.name}...`);

    const cmd = spawn('node', [script.path], {
        stdio: 'inherit',
        shell: true
    });

    cmd.on('close', (code) => {
        if (code === 0) {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ ${script.name} completed successfully.`);
        } else {
            console.error(`[${new Date().toLocaleTimeString()}] ❌ ${script.name} exited with code ${code}`);
        }
    });
}

function startEngine() {
    console.log(`
=================================================
    💹 MARKETVIBE REVENUE ENGINE STARTED
    System Status: AUTOMATED GO-TO-MARKET
=================================================
    `);

    // Initial run
    SCRIPTS.forEach(script => runScript(script));

    // Schedule subsequent runs
    SCRIPTS.forEach(script => {
        setInterval(() => runScript(script), script.interval);
    });
}

startEngine();
