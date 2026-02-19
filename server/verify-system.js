const http = require('http');

const baseUrl = 'localhost';
const port = 3000;

const request = (method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: baseUrl,
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsedBody });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

async function runTests() {
    console.log('--- STARTING TOTAL SYSTEM VERIFICATION ---');

    const timestamp = Date.now();
    const testUser = {
        name: 'System Tester',
        email: `tester_${timestamp}@test.com`,
        password: 'Password123!',
        companyName: 'Verification Corp'
    };

    console.log('1. Registering Test User...');
    const regRes = await request('POST', '/auth/register', testUser);
    if (regRes.status !== 201 && regRes.status !== 200) {
        console.error('Registration failed:', regRes.status, regRes.data);
        return;
    }
    const token = regRes.data.access_token;
    console.log('   OK: Registered and Authenticated');

    const endpoints = [
        { name: 'Dashboard Stats', path: '/stats/dashboard' },
        { name: 'Recent Alarms Sync', path: '/stats/recent-alarms' },
        { name: 'Audit Logs', path: '/network-elements/audit-logs' },
        { name: 'Projects List', path: '/projects' },
        { name: 'Project Elements', path: '/network-elements/project/ab706054-111a-441f-8095-ecf9b56382cf' },
        { name: 'OLT List', path: '/network-elements/olts' },
        { name: 'All Alarms', path: '/network-elements/alarms' },
        { name: 'Monitoring Data', path: '/network-elements/monitoring-data' },
        { name: 'Tenants List', path: '/tenants' },
        { name: 'Users List', path: '/users' }
    ];

    for (const ep of endpoints) {
        process.stdout.write(`Testing ${ep.name}... `);
        try {
            const res = await request('GET', ep.path, null, token);
            if (res.status === 200) {
                console.log('✅ OK');
            } else {
                console.log(`❌ FAILED (${res.status})`);
                console.log('   Response:', JSON.stringify(res.data).slice(0, 100));
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    console.log('--- VERIFICATION COMPLETED ---');
}

runTests();
