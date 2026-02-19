"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MockSnmpService {
    async getOnuOpticalInfo(ip, community) {
        if (ip === '1.1.1.1') {
            console.log('[MockSNMP] Fetching success for 1.1.1.1');
            const map = new Map();
            map.set('SNMPONU123', -18.5);
            return map;
        }
        if (ip === '2.2.2.2') {
            console.log('[MockSNMP] Returning empty for 2.2.2.2');
            return new Map();
        }
        throw new Error('SNMP Timeout');
    }
}
class MockOltCliService {
    async getOpticalSignals(host, protocol, config) {
        console.log(`[MockCLI] Fetching signals for ${host} using ${protocol}`);
        if (host === '2.2.2.2' || host === '3.3.3.3') {
            const map = new Map();
            map.set('CLIONU456', -22.1);
            return map;
        }
        return new Map();
    }
    async testParser(output) {
        const signals = new Map();
        const lines = output.split('\n');
        lines.forEach((line) => {
            const mSerial = line.match(/(?:SN:|Serial:|MAC:)?\s*([A-Za-z0-9]{12,16})/);
            const mPower = line.match(/(?:Rx:|Power:|Level:)?\s*(-?\d{1,3}\.\d+)/);
            if (mSerial && mPower) {
                const serial = mSerial[1].toUpperCase();
                const power = parseFloat(mPower[1]);
                if (power > -50 && power < 10 && !signals.has(serial)) {
                    signals.set(serial, power);
                }
            }
        });
        return signals;
    }
}
async function runSignalLogic(olt, snmpService, oltCliService) {
    console.log(`\n--- Testing Logic for OLT ${olt.ipAddress} [Mode: ${olt.monitoringMethod}] ---`);
    let signalMap = new Map();
    const method = olt.monitoringMethod || 'auto';
    try {
        if (method === 'snmp') {
            signalMap = await snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
        }
        else if (method === 'cli') {
            if (olt.cliUsername && olt.cliPassword) {
                signalMap = await oltCliService.getOpticalSignals(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword });
            }
            else {
                console.log(`[LIVE] Method is CLI but credentials are missing`);
            }
        }
        else {
            try {
                signalMap = await snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
                if (signalMap.size === 0 && olt.cliUsername) {
                    console.log('[LIVE] SNMP yielded no signals, trying CLI fallback...');
                    throw new Error('SNMP Empty');
                }
            }
            catch (snmpErr) {
                if (olt.cliUsername && olt.cliPassword) {
                    signalMap = await oltCliService.getOpticalSignals(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword });
                }
            }
        }
    }
    catch (e) {
        console.log(`[LIVE] Failed: ${e.message}`);
    }
    console.log(`Result: Found ${signalMap.size} signals.`);
    return signalMap;
}
async function main() {
    const snmp = new MockSnmpService();
    const cli = new MockOltCliService();
    await runSignalLogic({
        ipAddress: '1.1.1.1', community: 'public', monitoringMethod: 'snmp'
    }, snmp, cli);
    await runSignalLogic({
        ipAddress: '3.3.3.3', community: 'public', monitoringMethod: 'cli',
        cliUsername: 'admin', cliPassword: '123', cliProtocol: 'telnet'
    }, snmp, cli);
    await runSignalLogic({
        ipAddress: '2.2.2.2', community: 'public', monitoringMethod: 'auto',
        cliUsername: 'admin', cliPassword: '123', cliProtocol: 'ssh'
    }, snmp, cli);
    await runSignalLogic({
        ipAddress: '1.1.1.1', community: 'public', monitoringMethod: 'auto',
        cliUsername: 'admin', cliPassword: '123'
    }, snmp, cli);
    console.log('\n--- Testing CLI Parser ---');
    const sampleOutput = `
      OnuIndex              Sn                  State           Level
      ---------------------------------------------------------------------
      1/1/1:1               ZTEG12345678        Online          -18.44
      1/1/1:2               ZTEG87654321        Online          -22.10
      1/1/1:3               PHY-OFFLINE         Offline         -
      random text
      Serial: HVWU1A2B3C4D Power: -19.5 dBm
    `;
    const parsed = await cli.testParser(sampleOutput);
    console.log('Parsed Signals:', parsed);
}
main();
//# sourceMappingURL=test-signal-logic.js.map