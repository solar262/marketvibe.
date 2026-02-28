import { spawn } from 'child_process';
import path from 'path';

/**
 * 🚀 MarketVibe Revenue Engine (Engineering Edition)
 * Orchestrates all autonomous agents in parallel to drive lead generation, 
 * closer-mode sales, and nurture drips.
 */

const SCRIPTS = [
    { name: 'SENTINEL (Lead Finder)', path: 'outreach_agent.mjs', interval: 15 * 60 * 1000 }, // Every 15 mins
    { name: 'THE CLOSER (High Ticket Sales)', path: 'closer_autopilot.mjs', interval: 15 * 60 * 1000 }, // Every 15 mins
    { name: 'THE HERALD (Engagement)', path: 'herald_worker.mjs', interval: 5 * 60 * 1000 }, // Every 5 mins
    { name: 'THE BLOGGER (Content)', path: 'blog_worker.mjs', interval: 1 * 60 * 1000 }, // Every 1 min
    { name: 'THE NURTURER (Email Drip)', path: 'nurture_worker.mjs', interval: 60 * 60 * 1000 }, // Every 1 hour
    { name: 'THE PRODUCER (YouTube)', path: 'youtube_worker.mjs', interval: 24 * 60 * 60 * 1000 }, // Every 24 hours
    { name: 'RECOVERY AGENT (Checkout)', path: 'recovery_worker.mjs', interval: 30 * 60 * 1000 } // Every 30 mins
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

function scheduleNext(script) {
    // Add 20% jitter to intervals to mimic human behavior and avoid bans
    const jitter = (Math.random() * 0.4 - 0.2) * script.interval; // +/- 20%
    const nextInterval = script.interval + jitter;

    setTimeout(() => {
        runScript(script);
        scheduleNext(script);
    }, nextInterval);
}

function startEngine() {
    console.log(`
=================================================
    💹 MARKETVIBE REVENUE ENGINE STARTED
    System Status: HUMAN-IN-THE-LOOP SCALING
=================================================
    `);

    // Initial run with slight staggered start
    SCRIPTS.forEach((script, index) => {
        setTimeout(() => {
            runScript(script);
            scheduleNext(script);
        }, index * 5000); // 5s stagger between starting different agents
    });
}

startEngine();
