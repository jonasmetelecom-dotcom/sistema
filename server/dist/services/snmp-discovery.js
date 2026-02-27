"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const snmp = __importStar(require("net-snmp"));
const OLT_IP = '172.16.0.2';
const COMMUNITY = 'public';
async function discoverEnterpriseOIDs() {
    console.log('🔍 Starting OID discovery for Cianet OLT...\n');
    const session = snmp.createSession(OLT_IP, COMMUNITY, {
        timeout: 5000,
        retries: 2,
    });
    console.log('Step 1: Getting sysDescr...');
    session.get(['1.3.6.1.2.1.1.1.0'], (error, varbinds) => {
        if (!error && varbinds && varbinds.length > 0) {
            console.log(`✅ sysDescr: ${varbinds[0].value}\n`);
        }
        console.log('Step 2: Walking enterprise tree (1.3.6.1.4.1)...');
        const enterprises = new Set();
        session.walk('1.3.6.1.4.1', 100, (vbs) => {
            vbs.forEach((vb) => {
                if (!snmp.isVarbindError(vb)) {
                    const parts = vb.oid.split('.');
                    if (parts.length >= 7) {
                        const enterpriseId = parts.slice(0, 7).join('.');
                        enterprises.add(enterpriseId);
                    }
                }
            });
        }, (walkError) => {
            console.log(`\n✅ Found ${enterprises.size} enterprise IDs:\n`);
            const sortedEnterprises = Array.from(enterprises).sort();
            sortedEnterprises.forEach((oid) => {
                const id = oid.split('.')[6];
                let manufacturer = 'Unknown';
                if (id === '3902')
                    manufacturer = 'ZTE';
                else if (id === '5875')
                    manufacturer = 'FiberHome';
                else if (id === '37950')
                    manufacturer = 'V-Solution';
                else if (id === '2011')
                    manufacturer = 'Huawei';
                else if (id === '8072')
                    manufacturer = 'NET-SNMP (system)';
                console.log(`  ${oid} → ${manufacturer}`);
            });
            console.log('\n\nStep 3: Searching for ONU-related OIDs...');
            console.log('Looking for keywords: serial, status, power, optical, onu, gpon\n');
            const onuOids = [];
            sortedEnterprises.forEach((enterpriseOid) => {
                const id = enterpriseOid.split('.')[6];
                if (id === '8072')
                    return;
                console.log(`\nWalking ${enterpriseOid}...`);
                session.walk(enterpriseOid, 50, (vbs) => {
                    vbs.forEach((vb) => {
                        if (!snmp.isVarbindError(vb)) {
                            const value = vb.value?.toString().toLowerCase() || '';
                            const oid = vb.oid;
                            if (value.includes('serial') ||
                                value.includes('onu') ||
                                value.includes('gpon') ||
                                value.includes('power') ||
                                value.includes('optical') ||
                                value.includes('status')) {
                                onuOids.push({ oid, value });
                                console.log(`  📍 ${oid} = ${value}`);
                            }
                        }
                    });
                }, () => { });
            });
            setTimeout(() => {
                session.close();
                console.log('\n\n✅ Discovery complete!');
                console.log('\nNext steps:');
                console.log('1. Identify the real manufacturer from enterprise IDs');
                console.log('2. Use the ONU-related OIDs found above');
                console.log('3. Update snmp.service.ts with correct OIDs');
            }, 10000);
        });
    });
}
discoverEnterpriseOIDs();
//# sourceMappingURL=snmp-discovery.js.map