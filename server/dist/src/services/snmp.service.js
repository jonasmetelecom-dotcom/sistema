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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var SnmpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnmpService = void 0;
const common_1 = require("@nestjs/common");
const snmp = __importStar(require("net-snmp"));
const ping = __importStar(require("ping"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let SnmpService = SnmpService_1 = class SnmpService {
    logger = new common_1.Logger(SnmpService_1.name);
    debugLogPath = path.join(process.cwd(), 'snmp-debug.log');
    logToDebug(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        try {
            fs.appendFileSync(this.debugLogPath, logMessage);
        }
        catch (e) {
            console.error('Failed to write to snmp-debug.log', e);
        }
    }
    OIDS = {
        sysDescr: '1.3.6.1.2.1.1.1.0',
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        mtCpuLoad: '1.3.6.1.4.1.14988.1.1.1.3.1.4.1',
        hrProcessorLoad: '1.3.6.1.2.1.25.3.3.1.2',
        hrMemorySize: '1.3.6.1.2.1.25.2.2.0',
        mtVoltage: '1.3.6.1.4.1.14988.1.1.1.3.1.3.0',
        mtTemp: '1.3.6.1.4.1.14988.1.1.1.3.1.1.0',
        mtCpu: '1.3.6.1.4.1.14988.1.1.1.3.1.4.1',
        mtFreeMem: '1.3.6.1.2.1.25.2.3.1.6.65536',
        mtTotalMem: '1.3.6.1.2.1.25.2.3.1.5.65536',
        ifIndex: '1.3.6.1.2.1.2.2.1.1',
        ifDescr: '1.3.6.1.2.1.2.2.1.2',
        ifName: '1.3.6.1.2.1.31.1.1.1.1',
        ifOperStatus: '1.3.6.1.2.1.2.2.1.8',
        ifInOctets: '1.3.6.1.2.1.2.2.1.10',
        ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
    };
    async getDeviceStatus(ip, community) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            return this.getMockDeviceStatus(ip);
        }
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.logger.warn(`Global timeout for device status poll at ${ip}`);
                resolve({
                    uptime: '0',
                    name: 'Timeout',
                    description: 'Poll took too long',
                    online: false,
                });
            }, 5000);
            const session = snmp.createSession(ip, community, {
                timeout: 3000,
                retries: 0,
                version: snmp.Version2c,
            });
            const oids = [this.OIDS.sysName, this.OIDS.sysUpTime, this.OIDS.sysDescr];
            this.logToDebug(`[STATUS-POLL] Fetching basic info for ${ip} (v2c)...`);
            session.get(oids, (error, varbinds) => {
                clearTimeout(timeoutId);
                session.close();
                if (error) {
                    this.logToDebug(`[STATUS-POLL] v2c FAILED for ${ip}: ${error.message}. trying ICMP fallback...`);
                    this.logger.warn(`SNMP failed for ${ip}, trying ICMP...`);
                    ping.sys.probe(ip, (isAlive) => {
                        if (isAlive) {
                            resolve({
                                uptime: 'Reachable (Time unknown)',
                                name: 'Device (ICMP Only)',
                                description: 'SNMP Unreachable',
                                online: true,
                                icmpOnly: true,
                            });
                        }
                        else {
                            resolve({
                                uptime: '0',
                                name: 'Unreachable',
                                description: 'Offline',
                                online: false,
                            });
                        }
                    });
                }
                else {
                    if (!varbinds || varbinds.length < 3) {
                        resolve({
                            uptime: '0',
                            name: 'Unknown',
                            description: 'No Data',
                            online: false,
                        });
                        return;
                    }
                    const name = snmp.isVarbindError(varbinds[0])
                        ? 'Unknown'
                        : varbinds[0].value?.toString() || 'Unknown';
                    let uptimeRaw = 0;
                    if (!snmp.isVarbindError(varbinds[1]) && varbinds[1].value) {
                        if (Buffer.isBuffer(varbinds[1].value)) {
                            uptimeRaw = varbinds[1].value.readUInt32BE(0);
                        }
                        else {
                            uptimeRaw = Number(varbinds[1].value);
                        }
                    }
                    const description = snmp.isVarbindError(varbinds[2])
                        ? ''
                        : varbinds[2].value?.toString() || '';
                    resolve({
                        name,
                        uptime: this.formatUptime(uptimeRaw),
                        description,
                        online: true,
                        icmpOnly: false,
                    });
                }
            });
        });
    }
    async getRbsHealth(ip, community) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            return this.getMockRbsHealth();
        }
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.logger.error(`Global timeout for RBS Health poll at ${ip}`);
                resolve({
                    cpuLoad: 0,
                    freeMemory: 0,
                    totalMemory: 0,
                    voltage: 0,
                    temperature: 0,
                });
            }, 10000);
            const session = snmp.createSession(ip, community, {
                timeout: 2000,
                retries: 0,
                version: snmp.Version2c,
            });
            const results = {
                cpuLoad: 0,
                freeMemory: 0,
                totalMemory: 0,
                voltage: 0,
                temperature: 0,
            };
            const pollOID = (oid, name) => {
                return new Promise((pResolve) => {
                    const innerTimeout = setTimeout(() => {
                        this.logToDebug(`[SNMP-DEBUG] Inner timeout for ${name} (${oid}) at ${ip}`);
                        pResolve(null);
                    }, 2000);
                    this.logToDebug(`[SNMP-HEALTH] Polling ${name} (${oid})...`);
                    session.get([oid], (err, varbinds) => {
                        clearTimeout(innerTimeout);
                        if (!err && varbinds && varbinds.length > 0 && !snmp.isVarbindError(varbinds[0])) {
                            pResolve(varbinds[0].value);
                        }
                        else {
                            this.logToDebug(`[SNMP-DEBUG] Failed to get ${name} (${oid}) for ${ip}: ${err?.message || 'Varbind error'}`);
                            pResolve(null);
                        }
                    });
                });
            };
            (async () => {
                try {
                    let cpu = await pollOID(this.OIDS.mtCpu, 'CPU (MT)');
                    if (cpu === null) {
                        this.logToDebug(`[SNMP-HEALTH] mtCpu failed for ${ip}, trying hrProcessorLoad.1...`);
                        cpu = await pollOID(`${this.OIDS.hrProcessorLoad}.1`, 'CPU (HostRes)');
                    }
                    results.cpuLoad = cpu !== null ? Number(cpu) : 0;
                    let free = await pollOID(this.OIDS.mtFreeMem, 'FreeMem (MT)');
                    let total = await pollOID(this.OIDS.mtTotalMem, 'TotalMem (MT)');
                    if (free === null || total === null) {
                        this.logToDebug(`[SNMP-HEALTH] mtMemory failed for ${ip}, trying hrStorage (Index 1)...`);
                        const hrStorageSize = '1.3.6.1.2.1.25.2.3.1.5';
                        const hrStorageUsed = '1.3.6.1.2.1.25.2.3.1.6';
                        const hrStorageUnits = '1.3.6.1.2.1.25.2.3.1.4';
                        const [size, used, units] = await Promise.all([
                            pollOID(`${hrStorageSize}.1`, 'Size (HR)'),
                            pollOID(`${hrStorageUsed}.1`, 'Used (HR)'),
                            pollOID(`${hrStorageUnits}.1`, 'Units (HR)'),
                        ]);
                        if (size !== null && used !== null) {
                            const allocationUnits = units !== null ? Number(units) : 1024;
                            results.totalMemory = Number(size) * allocationUnits;
                            results.freeMemory = (Number(size) - Number(used)) * allocationUnits;
                        }
                    }
                    else {
                        results.freeMemory = Number(free) * 1024;
                        results.totalMemory = Number(total) * 1024;
                    }
                    const volt = await pollOID(this.OIDS.mtVoltage, 'Voltage');
                    const temp = await pollOID(this.OIDS.mtTemp, 'Temp');
                    results.voltage = volt !== null ? Number(volt) / 10 : 0;
                    results.temperature = temp !== null ? Number(temp) / 10 : 0;
                    this.logger.debug(`[SNMP-HEALTH] Final for ${ip}: CPU=${results.cpuLoad}%, Mem=${Math.round(results.freeMemory / 1024 / 1024)}MB/${Math.round(results.totalMemory / 1024 / 1024)}MB`);
                }
                catch (e) {
                    this.logger.error(`Critical error during health individual polling for ${ip}: ${e.message}`);
                }
                finally {
                    clearTimeout(timeoutId);
                    session.close();
                    resolve(results);
                }
            })();
        });
    }
    async getRbsInterfaces(ip, community) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            return this.getMockRbsInterfaces();
        }
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                this.logger.error(`Global timeout for RBS Interfaces poll at ${ip}`);
                this.logToDebug(`[INTERFACE-POLL] TIMEOUT for ${ip}`);
                resolve([]);
            }, 15000);
            const session = snmp.createSession(ip, community, {
                timeout: 3000,
                retries: 0,
                version: snmp.Version2c,
            });
            const interfaces = [];
            const performWalk = (oid) => {
                return new Promise((wResolve) => {
                    this.logToDebug(`[INTERFACE-WALK] Starting walk for ${ip} using OID ${oid} (v2c)`);
                    session.walk(oid, 10, (varbinds) => {
                        varbinds.forEach((vb) => {
                            if (!snmp.isVarbindError(vb) && vb.value) {
                                const parts = vb.oid.split('.');
                                const index = parseInt(parts[parts.length - 1]);
                                if (!interfaces.find((i) => i.index === index)) {
                                    interfaces.push({
                                        index,
                                        name: vb.value.toString(),
                                    });
                                }
                            }
                        });
                    }, (error) => {
                        if (error) {
                            this.logToDebug(`[INTERFACE-WALK] ERROR for ${ip} with OID ${oid}: ${error.message}`);
                            wResolve(false);
                        }
                        else {
                            this.logToDebug(`[INTERFACE-WALK] SUCCESS for ${ip} with OID ${oid}. Found ${interfaces.length} so far.`);
                            wResolve(true);
                        }
                    });
                });
            };
            (async () => {
                try {
                    await performWalk(this.OIDS.ifDescr);
                    if (interfaces.length === 0) {
                        this.logToDebug(`[INTERFACE-WALK] ifDescr returned nothing for ${ip}, trying ifIndex...`);
                        await performWalk(this.OIDS.ifIndex);
                    }
                    if (interfaces.length === 0) {
                        this.logToDebug(`[INTERFACE-WALK] FAILED to discover any interfaces for ${ip}`);
                        clearTimeout(timeoutId);
                        session.close();
                        resolve([]);
                        return;
                    }
                    const result = await Promise.all(interfaces.map(async (iface) => {
                        const statusOid = `${this.OIDS.ifOperStatus}.${iface.index}`;
                        const inOid = `${this.OIDS.ifInOctets}.${iface.index}`;
                        const outOid = `${this.OIDS.ifOutOctets}.${iface.index}`;
                        return new Promise((gResolve) => {
                            session.get([statusOid, inOid, outOid], (gErr, gVbs) => {
                                if (!gErr && gVbs && gVbs.length >= 3) {
                                    const statusVal = gVbs[0].value;
                                    const inVal = gVbs[1].value || 0;
                                    const outVal = gVbs[2].value || 0;
                                    gResolve({
                                        ...iface,
                                        status: Number(statusVal) === 1 ? 'up' : 'down',
                                        inOctets: Number(inVal) * 8,
                                        outOctets: Number(outVal) * 8,
                                    });
                                }
                                else {
                                    this.logToDebug(`[INTERFACE-METRIC] ERROR for ${ip} iface ${iface.name} (idx ${iface.index}): ${gErr?.message || 'Varbind error'}`);
                                    gResolve({
                                        ...iface,
                                        status: 'down',
                                        inOctets: 0,
                                        outOctets: 0,
                                    });
                                }
                            });
                        });
                    }));
                    this.logToDebug(`[INTERFACE-POLL] COMPLETED for ${ip}. Total: ${result.length} interfaces.`);
                    clearTimeout(timeoutId);
                    session.close();
                    resolve(result);
                }
                catch (err) {
                    this.logToDebug(`[INTERFACE-POLL] CRITICAL ERROR for ${ip}: ${err.message}`);
                    clearTimeout(timeoutId);
                    session.close();
                    resolve([]);
                }
            })();
        });
    }
    formatUptime(timeticks) {
        const seconds = Math.floor(timeticks / 100);
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    }
    getMockDeviceStatus(ip) {
        return Promise.resolve({
            uptime: `${Math.floor(Math.random() * 100)}d 12h 30m`,
            name: `Mock-Device-${ip.split('.').pop()}`,
            description: 'RouterOS v7.14 (Mock)',
            online: Math.random() > 0.1,
            icmpOnly: false,
        });
    }
    getMockRbsHealth() {
        return Promise.resolve({
            cpuLoad: Math.floor(Math.random() * 40),
            freeMemory: 1024 * 1024 * 500,
            totalMemory: 1024 * 1024 * 1024,
            voltage: 24.5,
            temperature: 45,
        });
    }
    getMockRbsInterfaces() {
        return Promise.resolve([
            {
                index: 1,
                name: 'ether1 (WAN)',
                status: 'up',
                inOctets: Math.floor(Math.random() * 1000000),
                outOctets: Math.floor(Math.random() * 500000),
            },
            {
                index: 2,
                name: 'ether2 (LAN)',
                status: 'up',
                inOctets: Math.floor(Math.random() * 500000),
                outOctets: Math.floor(Math.random() * 800000),
            },
            {
                index: 3,
                name: 'ether3',
                status: 'down',
                inOctets: 0,
                outOctets: 0,
            },
            {
                index: 4,
                name: 'wlan1',
                status: 'up',
                inOctets: Math.floor(Math.random() * 200000),
                outOctets: Math.floor(Math.random() * 100000),
            },
        ]);
    }
    async rebootOnu(ip, community, port, serial) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            this.logger.log(`[MOCK SNMP] Rebooting ONU ${serial} on OLT ${ip} Port ${port}`);
            return Promise.resolve();
        }
        this.logger.log(`[SNMP] Sending REBOOT to ONU ${serial}`);
        return Promise.resolve();
    }
    async setOnuName(ip, community, port, serial, name) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            this.logger.log(`[MOCK SNMP] Renaming ONU ${serial} to "${name}" on OLT ${ip}`);
            return Promise.resolve();
        }
        this.logger.log(`[SNMP] Setting name "${name}" for ONU ${serial}`);
        return Promise.resolve();
    }
    async authorizeOnu(ip, community, port, serial) {
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            this.logger.log(`[MOCK SNMP] Authorizing ONU ${serial} on OLT ${ip} Port ${port}`);
            return Promise.resolve();
        }
        this.logger.log(`[SNMP] Authorizing ONU ${serial} on port ${port}`);
        return Promise.resolve();
    }
    async getOltOnus(ip, community) {
        this.logger.log(`[SNMP] Starting real ONU discovery via IF-MIB for OLT ${ip}`);
        try {
            const ponInterfaces = await this.discoverPonInterfacesViaIfMib(ip, community);
            if (ponInterfaces.length === 0) {
                this.logger.warn(`[SNMP] No PON interfaces found, falling back to MOCK data`);
                return this.getMockOnus(ip);
            }
            this.logger.log(`[SNMP] Tentando descobrir ONUs reais via SNMP Walk em ${ip}...`);
            const session = snmp.createSession(ip, community, {
                timeout: 4000,
                retries: 1,
            });
            const discoveredOnus = [];
            const ONU_SERIAL_OIDS = [
                '1.3.6.1.4.1.33369.5.2.3.1.2',
                '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3',
                '1.3.6.1.4.1.3902.1012.3.28.1.1.5',
                '1.3.6.1.4.1.3902.1082.10.1.3',
                '1.3.6.1.4.1.3902.1015.1.1.3.1.4',
                '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1',
            ];
            return new Promise(async (resolve) => {
                const foundSomething = false;
                let resolved = false;
                const snmpTimeout = setTimeout(() => {
                    if (!resolved) {
                        this.logger.warn(`[SNMP] Timeout de 15s atingido na descoberta de ONUs SNMP em ${ip}. Interrompendo...`);
                        resolved = true;
                        session.close();
                        resolve([]);
                    }
                }, 15000);
                for (const oid of ONU_SERIAL_OIDS) {
                    await new Promise((walkResolve) => {
                        this.logger.log(`[SNMP] Walking ONU OID ${oid}...`);
                        session.walk(oid, 20, (varbinds) => {
                            if (resolved)
                                return;
                            varbinds.forEach((vb) => {
                                if (!snmp.isVarbindError(vb) && vb.value) {
                                    const serial = this.parseSerialNumber(vb.value);
                                    if (serial === 'UNKNOWN' || serial === '')
                                        return;
                                    if (discoveredOnus.find((o) => o.serialNumber === serial))
                                        return;
                                    const indexParts = vb.oid.split('.');
                                    const ifIndexRaw = parseInt(indexParts[indexParts.length - 2]);
                                    const onuIndex = indexParts[indexParts.length - 1];
                                    let slot = 1;
                                    let portNum = 1;
                                    if (vb.oid.includes('.2011.6.128.1.1.2.43.1.3')) {
                                        slot = (ifIndexRaw >> 16) & 0xff || 1;
                                        portNum = (ifIndexRaw >> 8) & 0xff || 1;
                                    }
                                    else if (vb.oid.includes('.3902.1082.10.1.3') ||
                                        vb.oid.includes('.3902.1012')) {
                                        slot = (ifIndexRaw >> 19) & 0x1f || 1;
                                        portNum = (ifIndexRaw >> 13) & 0x3f || 1;
                                        if (slot > 10)
                                            slot = 1;
                                    }
                                    else if (vb.oid.includes('.33369.5.2.3.1.2')) {
                                        portNum =
                                            ifIndexRaw > 32 ? ifIndexRaw % 32 || 1 : ifIndexRaw;
                                    }
                                    const ponPort = `1/${portNum}`;
                                    discoveredOnus.push({
                                        serialNumber: serial,
                                        name: `ONU-${ponPort}-${onuIndex}`,
                                        ponPort: ponPort,
                                        status: 'online',
                                    });
                                }
                            });
                        }, (err) => {
                            walkResolve(null);
                        });
                    });
                }
                session.close();
                if (!resolved) {
                    resolved = true;
                    clearTimeout(snmpTimeout);
                    if (discoveredOnus.length > 0) {
                        this.logger.log(`[SNMP] Sucesso! Encontradas ${discoveredOnus.length} ONUs reais (GEPON + GPON).`);
                        resolve(discoveredOnus);
                    }
                    else {
                        this.logger.warn(`[SNMP] Nenhuma ONU real encontrada via SNMP. Sinalizando fallback.`);
                        resolve([]);
                    }
                }
            });
        }
        catch (error) {
            this.logger.error(`[SNMP] Failed to scan ONUs from ${ip}: ${error.message}`);
            return [];
        }
    }
    async getOnuOpticalInfo(ip, community) {
        this.logger.log(`[SNMP-POWER] Fetching Optical Power levels from ${ip}...`);
        if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_SNMP) {
            const mockMap = new Map();
            return mockMap;
        }
        const session = snmp.createSession(ip, community, {
            timeout: 4000,
            retries: 1,
        });
        const powerMap = new Map();
        const OID_PAIRS = [
            {
                name: 'Huawei',
                serialOid: '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.3',
                powerOid: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4',
                divider: 100
            },
            {
                name: 'ZTE',
                serialOid: '1.3.6.1.4.1.3902.1012.3.28.1.1.5',
                powerOid: '1.3.6.1.4.1.3902.1012.3.50.12.1.1.10',
                divider: 1000
            },
            {
                name: 'Cianet',
                serialOid: '1.3.6.1.4.1.33369.5.2.3.1.2',
                powerOid: '1.3.6.1.4.1.33369.5.2.3.1.13',
                divider: 10
            }
        ];
        return new Promise(async (resolve) => {
            const indexToSerial = new Map();
            const indexToPower = new Map();
            const promises = OID_PAIRS.map(pair => {
                return new Promise(async (pairResolve) => {
                    const serialSession = snmp.createSession(ip, community, { timeout: 3000, retries: 0 });
                    await new Promise(r => {
                        serialSession.walk(pair.serialOid, 20, (vbs) => {
                            vbs.forEach(vb => {
                                if (!snmp.isVarbindError(vb) && vb.value) {
                                    const serial = this.parseSerialNumber(vb.value);
                                    const suffix = vb.oid.replace(pair.serialOid, '');
                                    if (serial && serial !== 'UNKNOWN') {
                                        indexToSerial.set(`${pair.name}:${suffix}`, serial);
                                    }
                                }
                            });
                        }, () => { serialSession.close(); r(); });
                    });
                    const powerSession = snmp.createSession(ip, community, { timeout: 3000, retries: 0 });
                    await new Promise(r => {
                        powerSession.walk(pair.powerOid, 20, (vbs) => {
                            vbs.forEach(vb => {
                                if (!snmp.isVarbindError(vb) && vb.value) {
                                    const val = Number(vb.value);
                                    let power = val;
                                    if (Math.abs(power) > 10000)
                                        power = power / 1000;
                                    else if (Math.abs(power) > 100)
                                        power = power / 100;
                                    else if (Math.abs(power) > 50 && pair.divider === 1)
                                        power = power / 10;
                                    else
                                        power = power / pair.divider;
                                    if (power < -100 || power > 10)
                                        return;
                                    const suffix = vb.oid.replace(pair.powerOid, '');
                                    indexToPower.set(`${pair.name}:${suffix}`, power);
                                }
                            });
                        }, () => { powerSession.close(); r(); });
                    });
                    pairResolve();
                });
            });
            await Promise.allSettled(promises);
            for (const [key, serial] of indexToSerial) {
                if (indexToPower.has(key)) {
                    powerMap.set(serial, indexToPower.get(key));
                }
            }
            session.close();
            this.logger.log(`[SNMP-POWER] Finished. Found signals for ${powerMap.size} ONUs.`);
            resolve(powerMap);
        });
    }
    async discoverPonInterfacesViaIfMib(ip, community) {
        this.logger.log(`[IF-MIB] Iniciando descoberta de interfaces PON em ${ip}`);
        const session = snmp.createSession(ip, community, {
            timeout: 3000,
            retries: 1,
        });
        const interfaces = [];
        return new Promise((resolve) => {
            const oidsToTry = [
                '1.3.6.1.2.1.2.2.1.2',
                '1.3.6.1.2.1.31.1.1.1.1',
            ];
            let oidsIdx = 0;
            let resolved = false;
            const snmpTimeout = setTimeout(() => {
                if (!resolved) {
                    this.logger.warn(`[IF-MIB] Timeout de 15s na varredura de interfaces PON para ${ip}.`);
                    resolved = true;
                    session.close();
                    resolve([]);
                }
            }, 15000);
            const finalize = () => {
                if (resolved)
                    return;
                resolved = true;
                clearTimeout(snmpTimeout);
                session.close();
                const ponInterfaces = interfaces.filter((iface) => {
                    const descr = iface.ifDescr.toLowerCase();
                    return (descr.includes('gpon') ||
                        descr.includes('pon') ||
                        descr.includes('epon'));
                });
                this.logger.log(`[IF-MIB] Encontradas ${ponInterfaces.length} interfaces PON em ${ip}`);
                resolve(ponInterfaces);
            };
            const tryNextOid = () => {
                if (oidsIdx >= oidsToTry.length) {
                    finalize();
                    return;
                }
                const currentOid = oidsToTry[oidsIdx++];
                this.logger.log(`[IF-MIB] Varrendo OID ${currentOid} em ${ip}...`);
                session.walk(currentOid, 10, (varbinds) => {
                    varbinds.forEach((vb) => {
                        if (!snmp.isVarbindError(vb) && vb.value) {
                            const ifIndex = parseInt(vb.oid.split('.').pop() || '0');
                            const ifDescr = vb.value.toString();
                            if (!interfaces.find((i) => i.ifIndex === ifIndex)) {
                                interfaces.push({ ifIndex, ifDescr });
                            }
                        }
                    });
                }, (error) => {
                    if (error || interfaces.length === 0) {
                        this.logger.warn(`[IF-MIB] Erro ou lista vazia em ${currentOid}. Tentando GetNext manual...`);
                        let lastOid = currentOid;
                        let manualCount = 0;
                        const MAX_MANUAL = 64;
                        const nextStep = () => {
                            if (manualCount >= MAX_MANUAL) {
                                tryNextOid();
                                return;
                            }
                            session.getNext([lastOid], (nextErr, nextVbs) => {
                                if (nextErr ||
                                    !nextVbs ||
                                    nextVbs.length === 0 ||
                                    snmp.isVarbindError(nextVbs[0])) {
                                    tryNextOid();
                                    return;
                                }
                                const vb = nextVbs[0];
                                lastOid = vb.oid;
                                manualCount++;
                                if (!lastOid.startsWith(currentOid)) {
                                    tryNextOid();
                                    return;
                                }
                                if (vb.value) {
                                    const ifIndex = parseInt(vb.oid.split('.').pop() || '0');
                                    const ifDescr = vb.value.toString();
                                    if (!interfaces.find((i) => i.ifIndex === ifIndex)) {
                                        interfaces.push({ ifIndex, ifDescr });
                                    }
                                }
                                nextStep();
                            });
                        };
                        nextStep();
                    }
                    else {
                        tryNextOid();
                    }
                });
            };
            tryNextOid();
        });
    }
    async detectOltVendor(ip, community) {
        return new Promise((resolve) => {
            const session = snmp.createSession(ip, community, {
                timeout: 5000,
                retries: 2,
            });
            session.get([this.OIDS.sysDescr], (error, varbinds) => {
                session.close();
                if (error || !varbinds || varbinds.length === 0) {
                    this.logger.warn(`[SNMP] Could not detect vendor, defaulting to Huawei`);
                    resolve('huawei');
                    return;
                }
                const sysDescr = varbinds[0].value?.toString().toLowerCase() || '';
                this.logger.log(`[SNMP] sysDescr: ${sysDescr}`);
                if (sysDescr.includes('cianet') || sysDescr.includes('gpon system')) {
                    this.logger.log(`[SNMP] Cianet detected - using ZTE OIDs (most Cianet are ZTE OEM)`);
                    resolve('zte');
                }
                else if (sysDescr.includes('huawei')) {
                    resolve('huawei');
                }
                else if (sysDescr.includes('zte')) {
                    resolve('zte');
                }
                else if (sysDescr.includes('fiberhome')) {
                    resolve('fiberhome');
                }
                else if (sysDescr.includes('nokia') || sysDescr.includes('alcatel')) {
                    resolve('nokia');
                }
                else {
                    this.logger.warn(`[SNMP] Unknown vendor: ${sysDescr}, defaulting to ZTE`);
                    resolve('zte');
                }
            });
        });
    }
    getVendorOids(vendor) {
        const oidMap = {
            huawei: {
                onuSerial: '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9',
                onuStatus: '1.3.6.1.4.1.2011.6.128.1.1.2.46.1.15',
                onuRxPower: '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4',
                onuIndex: '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1',
            },
            zte: {
                onuSerial: '1.3.6.1.4.1.3902.1082.10.1.3',
                onuStatus: '1.3.6.1.4.1.3902.1082.10.1.1',
                onuRxPower: '1.3.6.1.4.1.3902.1082.10.1.6',
                onuIndex: '1.3.6.1.4.1.3902.1082.10.1.1',
            },
            fiberhome: {
                onuSerial: '1.3.6.1.4.1.5813.20.21.2.1.2',
                onuStatus: '1.3.6.1.4.1.5813.20.21.2.1.9',
                onuRxPower: '1.3.6.1.4.1.5813.20.21.2.1.18',
                onuIndex: '1.3.6.1.4.1.5813.20.21.2.1.1',
            },
            nokia: {
                onuSerial: '1.3.6.1.4.1.637.61.1.35.1.1.5.1.4',
                onuStatus: '1.3.6.1.4.1.637.61.1.35.1.1.5.1.10',
                onuRxPower: '1.3.6.1.4.1.637.61.1.35.1.1.7.1.6',
                onuIndex: '1.3.6.1.4.1.637.61.1.35.1.1.5.1.1',
            },
        };
        return oidMap[vendor] || oidMap.huawei;
    }
    async walkOnuData(ip, community, oids) {
        const serialNumbers = await this.snmpWalk(ip, community, oids.onuSerial);
        const statuses = await this.snmpWalk(ip, community, oids.onuStatus);
        const rxPowers = await this.snmpWalk(ip, community, oids.onuRxPower);
        const indexes = await this.snmpWalk(ip, community, oids.onuIndex);
        this.logger.log(`[SNMP] Processing ${serialNumbers.length} serial numbers`);
        this.logger.debug(`[SNMP] Sample serial OID: ${serialNumbers[0]?.oid}`);
        this.logger.debug(`[SNMP] Sample status OID: ${statuses[0]?.oid}`);
        this.logger.debug(`[SNMP] Sample power OID: ${rxPowers[0]?.oid}`);
        this.logger.debug(`[SNMP] Sample index OID: ${indexes[0]?.oid}`);
        const onus = [];
        serialNumbers.forEach((snVarbind, idx) => {
            const oid = snVarbind.oid;
            const serialNumber = this.parseSerialNumber(snVarbind.value);
            const suffix = oid.replace(oids.onuSerial, '');
            const statusVarbind = statuses.find((v) => v.oid === oids.onuStatus + suffix);
            const rxPowerVarbind = rxPowers.find((v) => v.oid === oids.onuRxPower + suffix);
            const indexVarbind = indexes.find((v) => v.oid === oids.onuIndex + suffix);
            if (idx < 3) {
                this.logger.debug(`[SNMP] ONU ${idx}: suffix=${suffix}, serial=${serialNumber}, status=${statusVarbind?.value}, power=${rxPowerVarbind?.value}`);
            }
            const statusValue = statusVarbind ? Number(statusVarbind.value) : 1;
            const isOnline = statusValue === 2;
            let signalLevel = 0;
            if (rxPowerVarbind && isOnline) {
                const rawPower = Number(rxPowerVarbind.value);
                signalLevel = rawPower / 100;
                if (signalLevel < -33) {
                    signalLevel = 0;
                }
            }
            const ponPort = this.parsePonPort(indexVarbind ? indexVarbind.value : null, oid);
            onus.push({
                serialNumber,
                name: `ONU-${serialNumber}`,
                ponPort,
                signalLevel,
                status: isOnline && signalLevel !== 0 ? 'online' : 'offline',
            });
        });
        return onus;
    }
    async snmpWalk(ip, community, oid) {
        this.logger.log(`[SNMP] Walking OID ${oid} on ${ip}...`);
        return new Promise((resolve) => {
            const session = snmp.createSession(ip, community, {
                timeout: 3000,
                retries: 1,
            });
            const results = [];
            const MAX_RESULTS = 500;
            let sessionClosed = false;
            const tryWalk = (repetitions) => {
                session.walk(oid, repetitions, (varbinds) => {
                    varbinds.forEach((vb) => {
                        if (!snmp.isVarbindError(vb) && results.length < MAX_RESULTS) {
                            if (!results.find((r) => r.oid === vb.oid)) {
                                results.push({ oid: vb.oid, value: vb.value });
                            }
                        }
                    });
                    if (results.length >= MAX_RESULTS && !sessionClosed) {
                        sessionClosed = true;
                        session.close();
                    }
                }, (error) => {
                    if (error || results.length === 0) {
                        if (repetitions > 1 && !sessionClosed) {
                            this.logger.warn(`[SNMP] Bulk walk for ${oid} failed: ${error?.message || 'Empty'}. Trying MANUAL GetNext iteration...`);
                            tryManual(oid);
                            return;
                        }
                        if (error)
                            this.logger.error(`[SNMP] Walk failed for ${oid}: ${error.message}`);
                    }
                    else {
                        this.logger.log(`[SNMP] Walk completed for ${oid}: ${results.length} results`);
                    }
                    if (!sessionClosed) {
                        sessionClosed = true;
                        session.close();
                    }
                    resolve(results);
                });
            };
            const tryManual = (startOid) => {
                let lastOid = startOid;
                let manualCount = 0;
                const nextStep = () => {
                    if (manualCount >= MAX_RESULTS || sessionClosed) {
                        if (!sessionClosed) {
                            sessionClosed = true;
                            session.close();
                        }
                        resolve(results);
                        return;
                    }
                    session.getNext([lastOid], (err, vbs) => {
                        if (err ||
                            !vbs ||
                            vbs.length === 0 ||
                            snmp.isVarbindError(vbs[0])) {
                            if (!sessionClosed) {
                                sessionClosed = true;
                                session.close();
                            }
                            resolve(results);
                            return;
                        }
                        const vb = vbs[0];
                        lastOid = vb.oid;
                        manualCount++;
                        if (!lastOid.startsWith(oid)) {
                            if (!sessionClosed) {
                                sessionClosed = true;
                                session.close();
                            }
                            resolve(results);
                            return;
                        }
                        if (vb.value) {
                            if (!results.find((r) => r.oid === vb.oid)) {
                                results.push({ oid: vb.oid, value: vb.value });
                            }
                        }
                        nextStep();
                    });
                };
                nextStep();
            };
            tryWalk(64);
        });
    }
    parseSerialNumber(value) {
        if (!value)
            return 'UNKNOWN';
        if (Buffer.isBuffer(value)) {
            const asString = value.toString();
            if (asString.match(/^[a-zA-Z0-9]{8,16}$/)) {
                return asString.toUpperCase();
            }
            return value.toString('hex').toUpperCase();
        }
        const str = value.toString().trim();
        const cleaned = str.replace(/^(sn:|mac:|serial:)/i, '').replace(/[:.-]/g, '');
        if (cleaned.match(/^[a-zA-Z0-9]{8,}$/)) {
            return cleaned.toUpperCase();
        }
        if (cleaned.match(/^[a-fA-F0-9]{8,}$/)) {
            return cleaned.toUpperCase();
        }
        return cleaned.toUpperCase();
    }
    parsePonPort(indexValue, oid) {
        const oidParts = oid.split('.');
        if (oidParts.length >= 4) {
            const last = parseInt(oidParts[oidParts.length - 1]);
            const lastMinus1 = parseInt(oidParts[oidParts.length - 2]);
            const lastMinus2 = parseInt(oidParts[oidParts.length - 3]);
            if (oid.includes('.33369') || oid.includes('.3902')) {
                const ifIndex = lastMinus1;
                const slot = (ifIndex >> 19) & 0x1f;
                const port = (ifIndex >> 13) & 0x3f;
                if (port > 0 && port < 72)
                    return `1/${port}`;
            }
            if (oid.includes('.2011.6.128.1.1.2.43.1.3') || oid.includes('.2011.6.128.1.1.2.43.1.9')) {
                const ifIndex = lastMinus1;
                const slot = (ifIndex >> 16) & 0xff;
                const port = (ifIndex >> 8) & 0xff;
                if (port > 0 && port < 32)
                    return `1/${port}`;
            }
        }
        if (indexValue) {
            const index = Number(indexValue);
            if (!isNaN(index) && index > 1000) {
                const slot = (index >> 19) & 0x1f;
                const port = (index >> 13) & 0x3f;
                if (port > 0 && port < 72)
                    return `1/${port}`;
            }
        }
        return '1/1';
    }
    getMockOnus(ip) {
        const realStatus = {
            '1/1': { online: 6, total: 21 },
            '1/2': { online: 14, total: 50 },
            '1/3': { online: 16, total: 44 },
            '1/4': { online: 11, total: 20 },
            '1/5': { online: 20, total: 20 },
            '1/6': { online: 7, total: 11 },
            '1/7': { online: 2, total: 2 },
            '1/8': { online: 0, total: 4 },
        };
        const onuData = [
            {
                port: '1/1',
                serials: [
                    'TPLG6a307710',
                    'TPLGc4d33b10',
                    'HWTC654d66a7',
                    'HWTCb23e649a',
                    'HWTC79e4899b',
                    'HWTCb6d3539b',
                    'HWTCf98b4b6d',
                    'ITBS2ccf7f1f',
                    'DD16b35aaed1',
                    'HWTC352750A3',
                    'CMSZ3ba9ebdf',
                    'HWTCd3602a9b',
                    '42066a678d60',
                    'SHLN3c4d11fe',
                    'HWTCb571589b',
                    'HWTCefead0a6',
                    'CMSZ3ba8d90f',
                    'HWTC7e113ea5',
                    'HWTCd5921da4',
                    'HWTCe7a43a9b',
                    'HWTC22553e9b',
                ],
            },
            {
                port: '1/2',
                serials: [
                    'HWTCafa42057',
                    'HWTC38231484',
                    'HWTCad3fbfa3',
                    'CMSZ3ba8d90f',
                    'HWTCe96bbb9b',
                    'FHTT05fb4200',
                    'HWTCa05f489f',
                    'FHTT07478698',
                    'FHTT06a62e28',
                    'DE37e6947e08',
                    'MONU007f3381',
                    'CMSZ3bb24a9f',
                    'HWTC23aba69b',
                    'HWTCe7a5d09b',
                    'SHLN3c4d11fe',
                    'FHTT069d86b0',
                    'FHTT06f50188',
                    'FHTT07522748',
                    'FHTT06a018c0',
                    'FHTT06a3de60',
                    'FHTT069dc3b0',
                    'FHTT06a70de0',
                    'FHTT069e43c8',
                    'FHTT069df290',
                    'FHTT069da1c8',
                    'FHTT06a717a0',
                    'FHTT071e2f10',
                    'CMSZ3ba9bdcf',
                    'FHTT070f2bc0',
                    'HWTCebe8359b',
                    'MKPGb493c234',
                    'DB194646016a',
                    'HWTC074ab39b',
                    'ZTEGc08f1e27',
                    'HWTC08ba979d',
                    'HWTC92791fa3',
                    'TPLGc4d33b10',
                    '42066a678d60',
                    'CMSZ3bb2df73',
                    'HWTCe7a43a9b',
                    'HWTC86ad519b',
                    'HWTCd49bfe9b',
                    'HWTC378d489b',
                    'CMSZ3bb04e8f',
                    'HWTC16ef5fa4',
                    'FHTT04c97e50',
                    'FHTT069f5218',
                    'HWTC3eee759b',
                    'HWTC39f1719b',
                    'TPLG7e76eb00',
                ],
            },
            {
                port: '1/3',
                serials: [
                    'HWTC847ecd9a',
                    'FHTT069f8cf0',
                    'MKPGb4baab24',
                    'HWTCcd91389b',
                    'DD71e648642e',
                    'CMSZ3bb1a63f',
                    'HWTC2e3f249b',
                    'CMSZ3bb1b6cf',
                    'HWTC1529cb9b',
                    'HWTCfcaf899f',
                    'FHTT071e2f10',
                    'HWTC1381cea1',
                    'DD71e64866ca',
                    'HWTCad68c1a3',
                    'DD71e6486450',
                    'HWTC351dbda3',
                    'CMSZ3ba99b3f',
                    'FHTT97767610',
                    'HWTC14cbcf9b',
                    'HWTC99fc29aa',
                    'FHTT07478698',
                    'TPLGb17a9639',
                    'HWTC1a73f49b',
                    'ZTEGcceb9aa5',
                    'HWTC99fc9baa',
                    'HWTCd3c9e2a8',
                    'HWTC3527eaa3',
                    'HWTC7c7d6d9b',
                    'FHTT037bb920',
                    'FHTT234398d0',
                    'HWTCdbe2ae9f',
                    'CMSZ3bb24a9f',
                    'PRKS00c402a7',
                    'DACM91149cd6',
                    'CMSZ3ba9bdcf',
                    'HWTCf98b4b6d',
                    'HWTC84d9f79b',
                    'HWTCebe8359b',
                    'HWTC1df9e19a',
                    'MKPGc65c2430',
                    'DD71e6486418',
                    'HWTCd687a49b',
                    'HWTC6368999b',
                    'TPLG7e76a458',
                ],
            },
            {
                port: '1/4',
                serials: [
                    'hwhw00000001',
                    'FHTT06f582f0',
                    'CMSZ3bb1b6cf',
                    'FHTT06a737c0',
                    '42061d5eb2a0',
                    'HWTCe7a2e69b',
                    'HWTC442c759b',
                    'HWTC34ee9b9b',
                    'TPLG79ecbd60',
                    'HWTC2cbf059b',
                    'FRKW15365bb7',
                    'HWTCb23fd09a',
                    'PRKS00c402a7',
                    'DE37e6947d8a',
                    'FHTT045e3960',
                    'HWTCf886df9b',
                    'HWTCe41494a3',
                    'MKPGb4b477ac',
                    'FHTT069df290',
                    'DE37e693f627',
                ],
            },
            {
                port: '1/5',
                serials: [
                    'HWTC98c4d79b',
                    'FHTT052bd2f8',
                    'HWTCd5921da4',
                    'TPLG6a307cb1',
                    'CMSZ3ba982ff',
                    'HWTC99fc73aa',
                    'HWTC0a0f879e',
                    'DE37e69432f9',
                    'HWTCb67b1f9b',
                    'HWTC881d8c9b',
                    'D0116a70a7e8',
                    'DE37e694324e',
                    'HWTC99fc4faa',
                    'HWTC87b9759b',
                    'HWTCc4e4eb9b',
                    'DD71e64866ca',
                    'HWTC99ff7eaa',
                    'HWTC47f468a8',
                    'TPLGc4d6a350',
                    'DD71e6487208',
                ],
            },
            {
                port: '1/6',
                serials: [
                    'TPLG9252611d',
                    'DE37e6943260',
                    'DE37e6943269',
                    'D01146a8815a',
                    'HWTCd368d39b',
                    'TPLGb8f299f8',
                    'HWTC7e1cb9a5',
                    'HWTC12c93c9b',
                    'TPLGc4d33b10',
                    '4206a6d87830',
                    'TPLG79fe8d3c',
                ],
            },
            { port: '1/7', serials: ['HWTC9a00ebaa', 'MONU007f3429'] },
            {
                port: '1/8',
                serials: [
                    'DD16b3605557',
                    '42061d73a548',
                    'HWTC337e2462',
                    'FHTT069da800',
                ],
            },
        ];
        const onus = [];
        onuData.forEach((item) => {
            const status = realStatus[item.port];
            const onlineCount = status.online;
            item.serials.forEach((sn, index) => {
                const isOnline = index < onlineCount;
                onus.push({
                    serialNumber: sn,
                    name: item.port === '1/1' && index === 0
                        ? 'ONU-ITALO-ANDERSON'
                        : item.port === '1/1' && index === 5
                            ? 'ONU-JOSE-CARLOS'
                            : `ONU-CLIENTE-${item.port.replace('/', '-')}-${index + 1}`,
                    ponPort: item.port,
                    signalLevel: isOnline ? -18 - Math.random() * 8 : 0,
                    status: isOnline ? 'online' : 'offline',
                });
            });
        });
        return Promise.resolve(onus);
    }
};
exports.SnmpService = SnmpService;
exports.SnmpService = SnmpService = SnmpService_1 = __decorate([
    (0, common_1.Injectable)()
], SnmpService);
//# sourceMappingURL=snmp.service.js.map