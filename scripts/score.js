/**
 * score.js - Automation Arena Scoring Engine
 * Run by GitHub Actions Job 3 (aggregate).
 * Node 20. No dependencies.
 */
const fs = require('fs');
const path = require('path');

const PLAYERS_FILE = path.join(__dirname, '../data/players.json');
const RESULTS_FILE = path.join(__dirname, '../data/results.json');
const ARTIFACTS_DIR = path.join(__dirname, '../artifacts'); // Downloaded from Job 2

function loadPlayers() {
    try {
        const data = fs.readFileSync(PLAYERS_FILE, 'utf8');
        return JSON.parse(data).filter(p => p.username !== '_readme');
    } catch (e) {
        console.error('Failed to load players.json', e);
        return [];
    }
}

function loadPlayerMetrics(username) {
    const metricPath = path.join(ARTIFACTS_DIR, `${username}-metrics.json`);
    try {
        if (fs.existsSync(metricPath)) {
            return JSON.parse(fs.readFileSync(metricPath, 'utf8'));
        }
    } catch (e) {
        console.error(`Failed to load metrics for ${username}`, e);
    }
    // Default fallback if metrics missing/broken
    return {
        runs: [],
        tools: [],
        powerUps: [],
        designScore: 0,
        reportingScore: 0,
        cicdScore: 0,
        status: 'no_metrics_found'
    };
}

function calculateScores(playersData) {
    const scoredPlayers = [];

    // First pass: calculate base scores
    for (const p of playersData) {
        const m = p.metrics;
        let coverage = 0;
        let stability = 0;
        let bestPassed = 0;
        let maxPassed = 0;
        let minPassed = 40;
        let runs = m.runs || [];
        
        if (runs.length > 0) {
            for (const r of runs) {
                const passed = Math.min(r.passed || 0, 40);
                if (passed > maxPassed) maxPassed = passed;
                if (passed < minPassed) minPassed = passed;
                if (passed > bestPassed) bestPassed = passed;
            }
            // Coverage: best run / 40 * 40
            coverage = bestPassed; // (bestPassed / 40) * 40 is just bestPassed
            
            // Stability: 20 * (1 - (max - min)/40)
            stability = Math.max(0, 20 * (1 - (maxPassed - minPassed) / 40));
        } else {
            minPassed = 0;
        }

        const design = Math.min(15, m.designScore || 0);
        const reporting = Math.min(10, m.reportingScore || 0);
        const cicd = Math.min(10, m.cicdScore || 0);
        const bonus = Math.min(40, (m.powerUps ? m.powerUps.length : 0) * 4);
        const manual = p.manualPoints || 0;

        // Calculate median duration for speed scoring
        let medianDuration = 999999;
        if (runs.length > 0) {
            const sortedRuns = [...runs].sort((a,b) => (a.durationSec||0) - (b.durationSec||0));
            medianDuration = sortedRuns[Math.floor(sortedRuns.length/2)].durationSec || 999999;
        }

        scoredPlayers.push({
            username: p.username,
            displayName: p.displayName,
            tools: m.tools || [p.tool],
            powerUps: m.powerUps || [],
            testsPassed: bestPassed,
            testsTotal: 40,
            durationSec: medianDuration,
            runs: runs,
            status: m.status || 'success',
            scoreParts: {
                coverage,
                stability,
                design,
                reporting,
                cicd,
                bonus,
                manual
            }
        });
    }

    // Speed Scoring (relative among players with at least 30 passing tests)
    const eligibleForSpeed = scoredPlayers.filter(p => p.testsPassed >= 30).sort((a,b) => a.durationSec - b.durationSec);
    const speedPointsMap = {};
    if (eligibleForSpeed.length > 0) {
        const fastest = eligibleForSpeed[0].durationSec;
        const slowest = eligibleForSpeed[eligibleForSpeed.length - 1].durationSec;
        
        for (const p of eligibleForSpeed) {
            if (fastest === slowest) {
                speedPointsMap[p.username] = 5;
            } else {
                // Linear scaling 5 to 1
                let pts = 5 - (4 * ((p.durationSec - fastest) / (slowest - fastest)));
                speedPointsMap[p.username] = Number(pts.toFixed(1));
            }
        }
    }

    // Assign speed, total, badges and rank
    for (const p of scoredPlayers) {
        p.scoreParts.speed = speedPointsMap[p.username] || 0;
        p.scoreParts.total = p.scoreParts.coverage + p.scoreParts.stability + 
                             p.scoreParts.design + p.scoreParts.reporting + 
                             p.scoreParts.cicd + p.scoreParts.speed + 
                             p.scoreParts.bonus + p.scoreParts.manual;
        
        // Badges
        const badges = [];
        if (p.scoreParts.coverage === 40) badges.push("Perfect 40");
        if (p.scoreParts.speed === 5 && p.testsPassed >= 30) badges.push("Speed Demon");
        if (p.scoreParts.stability === 20 && p.testsPassed >= 30) badges.push("Stable as a Rock");
        if (p.scoreParts.cicd === 10) badges.push("Pipeline Pro");
        if (p.tools && p.tools.length > 1) badges.push("Full Stack Tester");
        p.badges = badges;
    }

    // Sort by Total > Tests Passed > Speed > Username
    scoredPlayers.sort((a, b) => {
        if (Math.abs(b.scoreParts.total - a.scoreParts.total) > 0.01) return b.scoreParts.total - a.scoreParts.total;
        if (b.testsPassed !== a.testsPassed) return b.testsPassed - a.testsPassed;
        if (a.durationSec !== b.durationSec) return a.durationSec - b.durationSec;
        return a.username.localeCompare(b.username);
    });

    // Format output
    return scoredPlayers.map((p, idx) => ({
        username: p.username,
        displayName: p.displayName,
        rank: idx + 1,
        testsPassed: p.testsPassed,
        testsTotal: p.testsTotal,
        durationSec: p.durationSec,
        runs: p.runs,
        score: p.scoreParts,
        powerUps: p.powerUps,
        tools: p.tools,
        badges: p.badges,
        status: p.status
    }));
}

function main() {
    const players = loadPlayers();
    const playersData = players.map(p => {
        return {
            ...p,
            metrics: loadPlayerMetrics(p.username)
        };
    });

    const finalResults = calculateScores(playersData);
    const output = {
        updatedAt: new Date().toISOString(),
        players: finalResults
    };

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`Scoring complete. Wrote ${finalResults.length} players to results.json`);
}

main();
