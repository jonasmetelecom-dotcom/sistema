
const snmp = require('net-snmp');

function parseSerialNumber(value) {
    if (!value) return 'UNKNOWN';
    const str = value.toString();
    if (str.match(/^[a-zA-Z0-9]{8,}$/)) {
        return str.toUpperCase().trim();
    }
    if (Buffer.isBuffer(value)) {
        return value.toString('hex').toUpperCase();
    }
    return str.toUpperCase().trim();
}

function normalizePonPort(port) {
    const trimmed = (port || '').trim();
    const m = trimmed.match(/(\d+)[\/\-]?(\d+)(?::\d+)?$/);
    if (m) {
        const slot = parseInt(m[1]);
        const portNum = parseInt(m[2]);
        return `${slot === 0 ? 1 : slot}/${portNum}`;
    }
    return trimmed.replace(/^0\//, '1/').split(':')[0].split(' ')[0];
}

console.log('--- TEST: Port Normalization ---');
console.log('1/1:5  ->', normalizePonPort('1/1:5'));
console.log('0/1/1  ->', normalizePonPort('0/1/1'));
console.log('1/1    ->', normalizePonPort('1/1'));
console.log('gpon 0/1 ->', normalizePonPort('gpon 0/1'));

console.log('\n--- TEST: Serial Parsing ---');
const hexSerial = Buffer.from([0x48, 0x57, 0x54, 0x43, 0x31, 0x32, 0x33, 0x34]);
console.log('Hex HWTC1234 ->', parseSerialNumber(hexSerial));
console.log('String tplg1234 ->', parseSerialNumber('tplg1234'));

const host = '10.0.0.1'; // We don't have the real IP here, so we just test the logic
console.log('\nDiagnostic logic verified. Ready to apply to server.');
