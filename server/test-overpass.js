const https = require('https');

// Coordinates for the area near "R. Aladi Schendroski Bini, Itajaí, SC"
// Based on Google Maps, this is roughly:
const south = -26.9150;
const west = -48.6675;
const north = -26.9110;
const east = -48.6620;

// Query 1: Just count buildings
const queryCount = `[out:json];(nwr["building"](${south},${west},${north},${east}););out count;`;

// Query 2: Get a sample of buildings to see what they are
const querySample = `[out:json];(nwr["building"](${south},${west},${north},${east}););out body 5;`;

async function runTest(query, label) {
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    console.log(`\n--- Testing ${label} ---`);

    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Antigravity-Diagnostic' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(JSON.stringify(json, null, 2));
                } catch (e) {
                    console.log('Error parsing JSON');
                    console.log('Raw data first 100 bytes:', data.substring(0, 100));
                }
                resolve();
            });
        }).on('error', (err) => {
            console.log('Request error:', err.message);
            resolve();
        });
    });
}

async function main() {
    await runTest(queryCount, 'Count Query');
    await runTest(querySample, 'Sample Elements');
}

main();
