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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OltDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OltDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const snmp = __importStar(require("net-snmp"));
const olt_entity_1 = require("../network-elements/entities/olt.entity");
const pon_port_entity_1 = require("../network-elements/entities/pon-port.entity");
const onu_entity_1 = require("../network-elements/entities/onu.entity");
const olt_cli_service_1 = require("./olt-cli.service");
const snmp_service_1 = require("./snmp.service");
let OltDiscoveryService = OltDiscoveryService_1 = class OltDiscoveryService {
    oltsRepository;
    ponPortsRepository;
    onusRepository;
    oltCliService;
    snmpService;
    logger = new common_1.Logger(OltDiscoveryService_1.name);
    constructor(oltsRepository, ponPortsRepository, onusRepository, oltCliService, snmpService) {
        this.oltsRepository = oltsRepository;
        this.ponPortsRepository = ponPortsRepository;
        this.onusRepository = onusRepository;
        this.oltCliService = oltCliService;
        this.snmpService = snmpService;
    }
    activeDiscoveries = new Set();
    activeIps = new Set();
    async discoverOlt(oltId) {
        if (this.activeDiscoveries.has(oltId)) {
            this.logger.warn(`[DISCOVERY] Discovery already in progress for OLT ${oltId}.`);
            this.activeDiscoveries.delete(oltId);
        }
        const olt = await this.oltsRepository
            .createQueryBuilder('olt')
            .addSelect('olt.cliPassword')
            .where('olt.id = :id', { id: oltId })
            .getOne();
        if (!olt)
            throw new Error(`OLT ${oltId} not found`);
        this.activeDiscoveries.add(oltId);
        if (olt.ipAddress)
            this.activeIps.add(olt.ipAddress);
        await this.oltsRepository.update(oltId, {
            discoveryResults: { lastRun: new Date(), status: 'running', errors: [] },
        });
        const result = {
            success: false,
            errors: [],
            capabilities: {
                pon_status_snmp: false,
                pon_traffic_snmp: false,
                uplink_power_snmp: false,
                onu_power_snmp: false,
                onu_power_cli: 'unknown',
            },
        };
        try {
            await this.performDiscoverySteps(olt, result, oltId);
        }
        catch (saveError) {
            this.logger.error(`[DISCOVERY] Discovery failed: ${saveError.message}`);
            result.errors.push(saveError.message);
        }
        finally {
            this.activeDiscoveries.delete(oltId);
            if (olt.ipAddress)
                this.activeIps.delete(olt.ipAddress);
        }
        return result;
    }
    isDiscoveryActive(oltId) {
        return this.activeDiscoveries.has(oltId);
    }
    isIpDiscoveryActive(ip) {
        return this.activeIps.has(ip);
    }
    async performDiscoverySteps(olt, result, oltId) {
        let identity = await this.discoverIdentity(olt.ipAddress, olt.community);
        if (identity.sysObjectID === 'unknown' &&
            olt.cliUsername &&
            olt.cliPassword) {
            const cliInfo = await this.discoverIdentityViaCli(olt);
            if (cliInfo)
                identity = cliInfo;
        }
        result.sysDescr = identity.sysDescr;
        result.sysObjectID = identity.sysObjectID;
        let ponPorts = await this.discoverPonPorts(olt.ipAddress, olt.community, olt.tenantId);
        if (ponPorts.length === 0 && olt.cliUsername && olt.cliPassword) {
            ponPorts = await this.discoverPonPortsViaCli(olt, identity.sysObjectID);
        }
        result.ponPorts = ponPorts;
        if (result.capabilities) {
            result.capabilities.uplink_power_snmp = await this.discoverUplinkPower(olt.ipAddress, olt.community);
            const onuPower = await this.discoverOnuPowerCapability(olt.ipAddress, olt.community);
            result.capabilities.onu_power_snmp = onuPower;
        }
        this.logger.log(`[DESCOBERTA] Passo 5: Consultando ONUs em tempo real...`);
        const liveOnus = await this.getOnusLive(olt, identity.sysObjectID);
        result.discoveredOnus = liveOnus;
        await this.saveDiscoveryResults(oltId, result);
        result.success = true;
    }
    async getOnusLive(olt, detectedSysObjectID) {
        this.logger.log(`[LIVE] Iniciando varredura paralela CLI + SNMP para OLT ${olt.ipAddress}`);
        const results = await Promise.allSettled([
            (async () => {
                if (olt.cliUsername && olt.cliPassword) {
                    return await Promise.race([
                        this.discoverOnusViaCli(olt, detectedSysObjectID),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('CLI Discovery Timeout (30s)')), 30000)),
                    ]);
                }
                return [];
            })(),
            this.snmpService.getOltOnus(olt.ipAddress, olt.community),
        ]);
        const cliOnus = results[0].status === 'fulfilled' ? results[0].value : [];
        const snmpOnus = results[1].status === 'fulfilled' ? results[1].value : [];
        if (results[0].status === 'rejected') {
            this.logger.error(`[LIVE] CLI Discovery failed or timed out: ${results[0].reason}`);
        }
        if (results[1].status === 'rejected') {
            this.logger.error(`[LIVE] SNMP Discovery failed: ${results[1].reason}`);
        }
        this.logger.log(`[LIVE] Resultados brutos: CLI=${cliOnus.length}, SNMP=${snmpOnus.length}`);
        let signalMap = new Map();
        const method = olt.monitoringMethod || 'auto';
        this.logger.log(`[LIVE] Signal Fetch Strategy: ${method.toUpperCase()}`);
        try {
            if (method === 'snmp') {
                signalMap = await this.snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
            }
            else if (method === 'cli') {
                if (olt.cliUsername && olt.cliPassword) {
                    signalMap = await this.oltCliService.getOpticalSignals(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword });
                }
                else {
                    this.logger.error(`[LIVE] Method is CLI but credentials are missing for ${olt.ipAddress}`);
                }
            }
            else {
                try {
                    signalMap = await this.snmpService.getOnuOpticalInfo(olt.ipAddress, olt.community);
                    if (signalMap.size === 0 && olt.cliUsername) {
                        this.logger.log('[LIVE] SNMP yielded no signals, trying CLI fallback...');
                        throw new Error('SNMP Empty');
                    }
                }
                catch (snmpErr) {
                    if (olt.cliUsername && olt.cliPassword) {
                        signalMap = await this.oltCliService.getOpticalSignals(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword });
                    }
                }
            }
        }
        catch (e) {
            this.logger.warn(`[LIVE] Failed to fetch optical signals via ${method}: ${e.message}`);
        }
        if (cliOnus.length > 0 || snmpOnus.length > 0) {
            this.logger.log(`[LIVE] Modo Unificado: Unindo inventário CLI (${cliOnus.length}) e SNMP (${snmpOnus.length}) para OLT ${olt.ipAddress}.`);
            const all = new Map();
            snmpOnus.forEach((o) => {
                const signal = signalMap.get(o.serialNumber);
                all.set(o.serialNumber, {
                    ...o,
                    discoverySource: 'snmp',
                    signalLevel: signal !== undefined ? signal : null
                });
            });
            cliOnus.forEach((o) => {
                const existing = all.get(o.serialNumber);
                const signal = signalMap.get(o.serialNumber);
                let finalSignal = null;
                if (signal !== undefined)
                    finalSignal = signal;
                else if (o.signalLevel && o.signalLevel !== -20.0)
                    finalSignal = o.signalLevel;
                if (existing) {
                    all.set(o.serialNumber, {
                        ...existing,
                        ...o,
                        ponPort: o.ponPort || existing.ponPort,
                        discoverySource: 'both',
                        signalLevel: finalSignal ?? existing.signalLevel
                    });
                }
                else {
                    all.set(o.serialNumber, {
                        ...o,
                        discoverySource: 'cli',
                        signalLevel: finalSignal
                    });
                }
            });
            const final = Array.from(all.values());
            await this.saveDiscoveryResults(olt.id, { success: true, discoveredOnus: final, errors: [] }, true);
            return final;
        }
        const all = new Map();
        snmpOnus.forEach((o) => {
            const signal = signalMap.get(o.serialNumber);
            all.set(o.serialNumber, {
                ...o,
                signalLevel: signal !== undefined ? signal : null
            });
        });
        const final = Array.from(all.values());
        this.logger.log(`[LIVE] Unificação concluída (SNMP Fallback): ${final.length} ONUs retornadas.`);
        await this.saveDiscoveryResults(olt.id, { success: true, discoveredOnus: final, errors: [] }, true);
        return final;
    }
    async discoverIdentity(ip, community) {
        return new Promise((resolve) => {
            const session = snmp.createSession(ip, community, {
                timeout: 3000,
                retries: 1,
            });
            session.get(['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.2.0'], (error, varbinds) => {
                if (error || !varbinds || varbinds.length < 2) {
                    session.close();
                    resolve({ sysDescr: 'Unknown', sysObjectID: 'unknown' });
                    return;
                }
                const res = {
                    sysDescr: varbinds[0]?.value?.toString() || 'Unknown',
                    sysObjectID: varbinds[1]?.value?.toString() || 'unknown',
                };
                session.close();
                resolve(res);
            });
        });
    }
    async discoverIdentityViaCli(olt) {
        try {
            const out = await this.oltCliService.executeCommand(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword }, 'show version');
            if (out.toLowerCase().includes('cianet'))
                return { sysDescr: 'Cianet OLT', sysObjectID: '.1.3.6.1.4.1.33369' };
            return { sysDescr: 'Generic OLT (CLI)', sysObjectID: 'generic_cli' };
        }
        catch {
            return null;
        }
    }
    async discoverPonPorts(ip, community, tenantId) {
        return new Promise((resolve) => {
            const session = snmp.createSession(ip, community, {
                timeout: 4000,
                retries: 1,
            });
            const interfaces = [];
            session.walk('1.3.6.1.2.1.2.2.1.2', 20, (vbs) => {
                vbs.forEach((vb) => {
                    if (vb.oid && vb.value) {
                        interfaces.push({
                            ifIndex: parseInt(vb.oid.split('.').pop()),
                            ifDescr: vb.value.toString(),
                        });
                    }
                });
            }, (err) => {
                session.close();
                const filtered = interfaces
                    .filter((i) => /pon|gpon|epon/i.test(i.ifDescr))
                    .map((i) => ({ ...i, tenantId, ifOperStatus: 1 }));
                resolve(filtered);
            });
        });
    }
    async discoverPonPortsViaCli(olt, sysId) {
        const out = await this.oltCliService.executeCommandSequence(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword }, ['enable', 'terminal length 0', 'show interface brief']);
        const pons = [];
        out.split('\n').forEach((line, i) => {
            const m = line.match(/(pon|gpon|epon)\s*([\d\/:\-]+)/i);
            if (m)
                pons.push({
                    ifIndex: 2000 + i,
                    ifDescr: m[0],
                    tenantId: olt.tenantId,
                    ifOperStatus: 1,
                });
        });
        return pons;
    }
    async discoverUplinkPower(ip, community) {
        return true;
    }
    async discoverOnuPowerCapability(ip, community) {
        return false;
    }
    async discoverOnusViaCli(olt, sysId) {
        const isCianet = (sysId || olt.sysObjectID || '').includes('33369') ||
            (olt.sysDescr || '').toLowerCase().includes('cianet') ||
            !!(olt.cliUsername && olt.cliPassword);
        if (!isCianet)
            return [];
        const cmds = [
            'enable',
            'terminal length 0',
            'screen-length 0 temp',
            'show gpon onu information all',
            'show gpon onu unconfigured',
            'show onu information all',
            'show onu unconfigured',
        ];
        const out = await this.oltCliService.executeCommandSequence(olt.ipAddress, olt.cliProtocol, { username: olt.cliUsername, password: olt.cliPassword }, cmds);
        const discovered = [];
        const lines = out.split('\n');
        lines.forEach((line) => {
            const mPort = line.match(/([\d\/]+[:\s]+\d+)/);
            const mSerial = line.match(/(?:sn:|mac:)?([a-zA-Z0-9]{10,20})/i);
            const mStatus = line.match(/(operational|online|reg|offline|discovery|logging|up|down|config)/i);
            if (mPort && mSerial) {
                const fullPortRaw = mPort[1].split(/[:\s]+/)[0].trim();
                const serialNumber = mSerial[1]
                    .replace(/[:.-]/g, '')
                    .toUpperCase()
                    .trim();
                const status = mStatus
                    ? /online|reg|operational|up|config/i.test(mStatus[1])
                        ? 'online'
                        : 'offline'
                    : 'online';
                const ponPort = this.normalizePonPort(fullPortRaw);
                if (!discovered.find((o) => o.serialNumber === serialNumber)) {
                    discovered.push({
                        serialNumber: serialNumber,
                        ponPort: ponPort,
                        status: status,
                        name: `ONU ${serialNumber.substring(0, 6)}`,
                    });
                }
            }
        });
        return discovered;
    }
    normalizePonPort(port) {
        if (!port)
            return '1/1';
        const trimmed = port.trim().toUpperCase();
        const mThree = trimmed.match(/(\d+)\/(\d+)\/(\d+)(?::\d+)?$/);
        if (mThree) {
            const slot = parseInt(mThree[2]);
            const portNum = parseInt(mThree[3]);
            return `${slot === 0 ? 1 : slot}/${portNum}`;
        }
        const mTwo = trimmed.match(/(\d+)[\/\-](\d+)(?::\d+)?$/);
        if (mTwo) {
            const slot = parseInt(mTwo[1]);
            const portNum = parseInt(mTwo[2]);
            return `${slot === 0 ? 1 : slot}/${portNum}`;
        }
        const mOne = trimmed.match(/^(\d+)$/);
        if (mOne) {
            return `1/${mOne[1]}`;
        }
        const cleaned = trimmed.replace(/[A-Z\s]/g, '').replace(/^0\//, '1/');
        return cleaned.split(':')[0] || '1/1';
    }
    async saveDiscoveryResults(oltId, result, forceReset = false) {
        const olt = await this.oltsRepository.findOne({ where: { id: oltId } });
        if (!olt)
            return;
        if (forceReset) {
            this.logger.log(`[DISCOVERY] Realizando Hard Reset (Deleção Total) para OLT ${oltId} antes de salvar novos dados.`);
            await this.onusRepository.delete({ oltId });
        }
        await this.oltsRepository.update(oltId, {
            sysDescr: result.sysDescr,
            sysObjectID: result.sysObjectID,
            capabilities: result.capabilities,
            discoveryResults: {
                lastRun: new Date(),
                status: result.success ? 'success' : 'failed',
                errors: result.errors,
            },
        });
        if (result.ponPorts && result.ponPorts.length > 0) {
            await this.ponPortsRepository.delete({ oltId });
            await this.ponPortsRepository.save(result.ponPorts.map((p) => ({ ...p, oltId, tenantId: olt.tenantId })));
        }
        if (result.discoveredOnus && result.discoveredOnus.length > 0) {
            const currentSerials = result.discoveredOnus.map((o) => o.serialNumber);
            await this.onusRepository
                .createQueryBuilder()
                .delete()
                .from(onu_entity_1.Onu)
                .where('oltId = :oltId', { oltId })
                .andWhere('serialNumber NOT IN (:...serials)', {
                serials: currentSerials,
            })
                .execute();
            this.logger.log(`[DISCOVERY] Limpeza concluída: ONUs antigas (fantasmas) removidas para OLT ${oltId}.`);
            for (const data of result.discoveredOnus) {
                const existing = await this.onusRepository.findOne({
                    where: {
                        serialNumber: data.serialNumber,
                        oltId,
                        tenantId: olt.tenantId,
                    },
                });
                if (existing) {
                    await this.onusRepository.update(existing.id, {
                        status: data.status,
                        ponPort: data.ponPort,
                        signalLevel: data.signalLevel,
                        lastSeen: data.status === 'online' ? new Date() : existing.lastSeen,
                    });
                }
                else {
                    await this.onusRepository.save(this.onusRepository.create({
                        ...data,
                        oltId,
                        tenantId: olt.tenantId,
                        isAuthorized: true,
                    }));
                }
            }
        }
    }
};
exports.OltDiscoveryService = OltDiscoveryService;
exports.OltDiscoveryService = OltDiscoveryService = OltDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(olt_entity_1.Olt)),
    __param(1, (0, typeorm_1.InjectRepository)(pon_port_entity_1.PonPort)),
    __param(2, (0, typeorm_1.InjectRepository)(onu_entity_1.Onu)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        olt_cli_service_1.OltCliService,
        snmp_service_1.SnmpService])
], OltDiscoveryService);
//# sourceMappingURL=olt-discovery.service.js.map