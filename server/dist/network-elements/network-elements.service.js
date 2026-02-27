"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NetworkElementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkElementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pole_entity_1 = require("./entities/pole.entity");
const box_entity_1 = require("./entities/box.entity");
const cable_entity_1 = require("./entities/cable.entity");
const splitter_entity_1 = require("./entities/splitter.entity");
const fusion_entity_1 = require("./entities/fusion.entity");
const projects_service_1 = require("../projects/projects.service");
const olt_entity_1 = require("./entities/olt.entity");
const onu_entity_1 = require("./entities/onu.entity");
const rbs_entity_1 = require("./entities/rbs.entity");
const alarm_entity_1 = require("./entities/alarm.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const work_order_entity_1 = require("./entities/work-order.entity");
const cto_customer_entity_1 = require("./entities/cto-customer.entity");
const pon_port_entity_1 = require("./entities/pon-port.entity");
const snmp_service_1 = require("../services/snmp.service");
const olt_discovery_service_1 = require("../services/olt-discovery.service");
const olt_cli_service_1 = require("../services/olt-cli.service");
const mikrotik_api_service_1 = require("../services/mikrotik-api.service");
const monitoring_gateway_1 = require("../gateways/monitoring.gateway");
const ping_service_1 = require("../services/ping.service");
let NetworkElementsService = NetworkElementsService_1 = class NetworkElementsService {
    polesRepository;
    boxesRepository;
    cablesRepository;
    splittersRepository;
    fusionsRepository;
    oltsRepository;
    onusRepository;
    ponPortsRepository;
    rbsRepository;
    alarmsRepository;
    auditLogsRepository;
    workOrdersRepository;
    ctoCustomersRepository;
    snmpService;
    oltDiscoveryService;
    oltCliService;
    mikrotikApiService;
    monitoringGateway;
    pingService;
    projectsService;
    logger = new common_1.Logger(NetworkElementsService_1.name);
    constructor(polesRepository, boxesRepository, cablesRepository, splittersRepository, fusionsRepository, oltsRepository, onusRepository, ponPortsRepository, rbsRepository, alarmsRepository, auditLogsRepository, workOrdersRepository, ctoCustomersRepository, snmpService, oltDiscoveryService, oltCliService, mikrotikApiService, monitoringGateway, pingService, projectsService) {
        this.polesRepository = polesRepository;
        this.boxesRepository = boxesRepository;
        this.cablesRepository = cablesRepository;
        this.splittersRepository = splittersRepository;
        this.fusionsRepository = fusionsRepository;
        this.oltsRepository = oltsRepository;
        this.onusRepository = onusRepository;
        this.ponPortsRepository = ponPortsRepository;
        this.rbsRepository = rbsRepository;
        this.alarmsRepository = alarmsRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.workOrdersRepository = workOrdersRepository;
        this.ctoCustomersRepository = ctoCustomersRepository;
        this.snmpService = snmpService;
        this.oltDiscoveryService = oltDiscoveryService;
        this.oltCliService = oltCliService;
        this.mikrotikApiService = mikrotikApiService;
        this.monitoringGateway = monitoringGateway;
        this.pingService = pingService;
        this.projectsService = projectsService;
    }
    async findAllByProject(projectId, user) {
        const project = await this.projectsService.findOne(projectId, user);
        if (!project) {
            throw new common_1.NotFoundException('Project not found or access denied');
        }
        const [poles, boxes, cables, splitters, fusions, onus, ctoCustomers] = await Promise.all([
            this.polesRepository.find({ where: { projectId } }),
            this.boxesRepository.find({ where: { projectId } }),
            this.cablesRepository.find({ where: { projectId } }),
            this.splittersRepository.find({ where: { projectId } }),
            this.fusionsRepository.find({ where: { projectId } }),
            this.onusRepository.find({ where: { projectId } }),
            this.ctoCustomersRepository.find({ where: { projectId } }),
        ]);
        return { poles, boxes, cables, splitters, fusions, onus, ctoCustomers };
    }
    async createPole(data) {
        const pole = this.polesRepository.create(data);
        return this.polesRepository.save(pole);
    }
    async createBox(data) {
        const box = this.boxesRepository.create(data);
        return this.boxesRepository.save(box);
    }
    async findOneBox(id) {
        return this.boxesRepository.findOne({ where: { id } });
    }
    async createCable(data) {
        const cable = this.cablesRepository.create(data);
        return this.cablesRepository.save(cable);
    }
    async createOnu(data) {
        const onu = this.onusRepository.create(data);
        return this.onusRepository.save(onu);
    }
    async updatePole(id, data) {
        const { id: _, ...updateData } = data;
        await this.polesRepository.update(id, updateData);
        return this.polesRepository.findOne({ where: { id } });
    }
    async updateBox(id, data) {
        const { id: _, ...updateData } = data;
        await this.boxesRepository.update(id, updateData);
        return this.boxesRepository.findOne({ where: { id } });
    }
    async updateCable(id, data) {
        const { id: _, ...updateData } = data;
        await this.cablesRepository.update(id, updateData);
        return this.cablesRepository.findOne({ where: { id } });
    }
    async deletePole(id) {
        return this.polesRepository.softDelete(id);
    }
    async restorePole(id) {
        return this.polesRepository.restore(id);
    }
    async restoreOnu(id) {
        return this.onusRepository.restore(id);
    }
    async restoreRbs(id, user) {
        return this.rbsRepository.restore(id);
    }
    async deleteBox(id) {
        try {
            await this.splittersRepository.softDelete({ boxId: id });
            await this.fusionsRepository.softDelete({ boxId: id });
        }
        catch (error) {
            console.error(`Soft delete internals failed for box ${id}, trying hard delete:`, error);
            try {
                await this.splittersRepository.delete({ boxId: id });
                await this.fusionsRepository.delete({ boxId: id });
            }
            catch (hardError) {
                console.error(`Hard delete internals also failed:`, hardError);
            }
        }
        try {
            return await this.boxesRepository.softDelete(id);
        }
        catch (error) {
            console.error(`Soft delete box ${id} failed, trying hard delete:`, error);
            return this.boxesRepository.delete(id);
        }
    }
    async restoreBox(id) {
        await this.splittersRepository.restore({ boxId: id });
        await this.fusionsRepository.restore({ boxId: id });
        return this.boxesRepository.restore(id);
    }
    async deleteCable(id) {
        return this.cablesRepository.softDelete(id);
    }
    async restoreCable(id) {
        return this.cablesRepository.restore(id);
    }
    async getBoxInternals(boxId) {
        const box = await this.boxesRepository.findOne({ where: { id: boxId } });
        if (!box)
            throw new Error('Box not found');
        console.log(`[getBoxInternals] Box ${boxId} at ${box.latitude}, ${box.longitude}`);
        const epsilon = 0.00001;
        const pole = await this.polesRepository
            .createQueryBuilder('pole')
            .where('pole.projectId = :projectId', { projectId: box.projectId })
            .andWhere('ABS(pole.latitude - :lat) < :epsilon', {
            lat: box.latitude,
            epsilon,
        })
            .andWhere('ABS(pole.longitude - :lng) < :epsilon', {
            lng: box.longitude,
            epsilon,
        })
            .getOne();
        console.log(`[getBoxInternals] Found underlying pole: ${pole ? pole.id : 'NONE'} (Fuzzy Search)`);
        const poleId = pole ? pole.id : null;
        const incomingQuery = [{ toId: boxId }];
        if (poleId)
            incomingQuery.push({ toId: poleId, toType: 'pole' });
        const outgoingQuery = [{ fromId: boxId }];
        if (poleId)
            outgoingQuery.push({ fromId: poleId, fromType: 'pole' });
        console.log('[getBoxInternals] Queries:', JSON.stringify({ incoming: incomingQuery, outgoing: outgoingQuery }));
        const [splitters, fusions, incomingCables, outgoingCables, ctoCustomers] = await Promise.all([
            this.splittersRepository.find({ where: { boxId } }),
            this.fusionsRepository.find({ where: { boxId } }),
            this.cablesRepository.find({ where: incomingQuery }),
            this.cablesRepository.find({ where: outgoingQuery }),
            this.ctoCustomersRepository.find({ where: { boxId } }),
        ]);
        console.log(`[getBoxInternals] Found: ${incomingCables.length} incoming, ${outgoingCables.length} outgoing, ${ctoCustomers.length} customers`);
        const destinationBoxIds = outgoingCables
            .filter((c) => c.toType === 'box' && c.toId)
            .map((c) => c.toId);
        const destinationTypes = {};
        if (destinationBoxIds.length > 0) {
            const uniqueIds = [...new Set(destinationBoxIds)];
            const destBoxes = await this.boxesRepository.find({
                where: { id: (0, typeorm_2.In)(uniqueIds) },
                select: ['id', 'type'],
            });
            destBoxes.forEach((b) => {
                destinationTypes[b.id] = b.type;
            });
        }
        return {
            splitters,
            fusions,
            incomingCables,
            outgoingCables,
            destinationTypes,
            ctoCustomers,
            images: box.images || [],
            poleId,
        };
    }
    async createSplitter(data) {
        const splitter = this.splittersRepository.create(data);
        return this.splittersRepository.save(splitter);
    }
    async createCtoCustomer(data) {
        const existing = await this.ctoCustomersRepository.findOne({
            where: {
                boxId: data.boxId,
                portIndex: data.portIndex,
            }
        });
        if (existing) {
            Object.assign(existing, data);
            return this.ctoCustomersRepository.save(existing);
        }
        const customer = this.ctoCustomersRepository.create(data);
        return this.ctoCustomersRepository.save(customer);
    }
    async createFusion(data) {
        const existing = await this.fusionsRepository.findOne({
            where: [
                {
                    originId: data.originId,
                    originFiberIndex: data.originFiberIndex,
                    destinationId: data.destinationId,
                    destinationFiberIndex: data.destinationFiberIndex,
                    boxId: data.boxId
                },
                {
                    originId: data.destinationId,
                    originFiberIndex: data.destinationFiberIndex,
                    destinationId: data.originId,
                    destinationFiberIndex: data.originFiberIndex,
                    boxId: data.boxId
                }
            ]
        });
        if (existing) {
            console.log('[createFusion] Fusion already exists, returning existing.');
            return existing;
        }
        const busy = await this.fusionsRepository.findOne({
            where: [
                { originId: data.originId, originFiberIndex: data.originFiberIndex, boxId: data.boxId },
                { destinationId: data.originId, destinationFiberIndex: data.originFiberIndex, boxId: data.boxId },
                { originId: data.destinationId, originFiberIndex: data.destinationFiberIndex, boxId: data.boxId },
                { destinationId: data.destinationId, destinationFiberIndex: data.destinationFiberIndex, boxId: data.boxId }
            ]
        });
        if (busy) {
            this.logger.warn(`Fiber already in use in box ${data.boxId}`);
        }
        const fusion = this.fusionsRepository.create(data);
        return this.fusionsRepository.save(fusion);
    }
    async deleteFusion(id) {
        return this.fusionsRepository.softDelete(id);
    }
    async splitCable(cableId, lat, lng) {
        const cable = await this.cablesRepository.findOne({ where: { id: cableId } });
        if (!cable)
            throw new common_1.NotFoundException('Cable not found');
        const box = this.boxesRepository.create({
            projectId: cable.projectId,
            latitude: lat,
            longitude: lng,
            type: 'ceo',
            name: `SPLIT-${Math.floor(Date.now() / 1000).toString().slice(-4)}`
        });
        const savedBox = await this.boxesRepository.save(box);
        let closestIdx = 0;
        let minDist = Infinity;
        cable.points.forEach((p, idx) => {
            const d = Math.sqrt(Math.pow(p.lat - lat, 2) + Math.pow(p.lng - lng, 2));
            if (d < minDist) {
                minDist = d;
                closestIdx = idx;
            }
        });
        const pointsA = cable.points.slice(0, closestIdx + 1);
        pointsA.push({ lat, lng });
        const pointsB = [{ lat, lng }, ...cable.points.slice(closestIdx + 1)];
        const cableA = this.cablesRepository.create({
            ...cable,
            id: undefined,
            toId: savedBox.id,
            toType: 'box',
            points: pointsA
        });
        const cableB = this.cablesRepository.create({
            ...cable,
            id: undefined,
            fromId: savedBox.id,
            fromType: 'box',
            points: pointsB
        });
        await Promise.all([
            this.cablesRepository.save(cableA),
            this.cablesRepository.save(cableB),
            this.cablesRepository.softDelete(cableId)
        ]);
        return { success: true, boxId: savedBox.id };
    }
    async autoAssociatePoles(cableId) {
        const cable = await this.cablesRepository.findOne({ where: { id: cableId } });
        if (!cable)
            return;
        const poles = await this.polesRepository.find({ where: { projectId: cable.projectId } });
        const associatedPoleIds = [];
        const distToSegment = (p, v, w) => {
            const l2 = Math.pow(v.lat - w.lat, 2) + Math.pow(v.lng - w.lng, 2);
            if (l2 === 0)
                return Math.sqrt(Math.pow(p.lat - v.lat, 2) + Math.pow(p.lng - v.lng, 2));
            let t = ((p.lat - v.lat) * (w.lat - v.lat) + (p.lng - v.lng) * (w.lng - v.lng)) / l2;
            t = Math.max(0, Math.min(1, t));
            return Math.sqrt(Math.pow(p.lat - (v.lat + t * (w.lat - v.lat)), 2) + Math.pow(p.lng - (v.lng + t * (w.lng - v.lng)), 2));
        };
        const threshold = 0.00005;
        poles.forEach(pole => {
            const polePos = { lat: pole.latitude, lng: pole.longitude };
            for (let i = 0; i < cable.points.length - 1; i++) {
                const dist = distToSegment(polePos, cable.points[i], cable.points[i + 1]);
                if (dist < threshold) {
                    associatedPoleIds.push(pole.id);
                    break;
                }
            }
        });
        await this.cablesRepository.update(cableId, { poleIds: associatedPoleIds });
        return associatedPoleIds;
    }
    async licensePoles(cableId) {
        const cable = await this.cablesRepository.findOne({ where: { id: cableId } });
        if (!cable || !cable.poleIds || cable.poleIds.length === 0)
            return { success: false, message: 'Nenhum poste associado' };
        await this.polesRepository.update({ id: (0, typeorm_2.In)(cable.poleIds) }, { licensed: true, status: 'built' });
        return { success: true };
    }
    async convertPointsToPoles(cableId) {
        const cable = await this.cablesRepository.findOne({ where: { id: cableId } });
        if (!cable)
            throw new common_1.NotFoundException('Cabo não encontrado');
        const newPoles = [];
        for (const point of cable.points) {
            const existing = await this.polesRepository.findOne({
                where: { latitude: point.lat, longitude: point.lng, projectId: cable.projectId }
            });
            if (!existing) {
                const pole = this.polesRepository.create({
                    projectId: cable.projectId,
                    latitude: point.lat,
                    longitude: point.lng,
                    name: `P-${cable.name || 'NEW'}-${Math.floor(Math.random() * 1000)}`,
                    status: 'built'
                });
                newPoles.push(pole);
            }
        }
        if (newPoles.length > 0) {
            await this.polesRepository.save(newPoles);
        }
        return this.autoAssociatePoles(cableId);
    }
    async convertPolesToPoints(cableId) {
        await this.cablesRepository.update(cableId, { poleIds: [] });
        return { success: true };
    }
    async calculateElevationDistance(cableId) {
        const cable = await this.cablesRepository.findOne({ where: { id: cableId } });
        if (!cable)
            throw new common_1.NotFoundException('Cabo não encontrado');
        const factor = 1.05;
        const currentLength = cable.length3D || 100;
        const newLength = currentLength * factor;
        await this.cablesRepository.update(cableId, { length3D: newLength });
        return { success: true, newLength };
    }
    async deleteSplitter(id) {
        await this.fusionsRepository.softDelete({
            originId: id,
            originType: 'splitter',
        });
        await this.fusionsRepository.softDelete({
            destinationId: id,
            destinationType: 'splitter',
        });
        return this.splittersRepository.softDelete(id);
    }
    async deleteCtoCustomer(id) {
        return this.ctoCustomersRepository.delete(id);
    }
    async findCtoCustomersByBox(boxId) {
        return this.ctoCustomersRepository.find({ where: { boxId } });
    }
    async createOlt(data, user) {
        const olt = this.oltsRepository.create({
            ...data,
            tenantId: user.tenantId,
        });
        const saved = await this.oltsRepository.save(olt);
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'CREATE',
            entityType: 'OLT',
            entityId: saved.id,
            details: JSON.stringify(saved),
            tenantId: user.tenantId,
        });
        this.pollDeviceStatus(saved.id, 'olt').catch((err) => this.logger.error(`Initial quick poll failed for OLT ${saved.id}`, err));
        this.runOltDiscovery(saved.id, user.tenantId).catch((err) => this.logger.error(`Automatic discovery failed for OLT ${saved.id}`, err));
        return saved;
    }
    async createRbs(data, user) {
        console.log('[CREATE RBS] Received data:', JSON.stringify(data, null, 2));
        const rbs = this.rbsRepository.create({ ...data, tenantId: user.tenantId });
        const saved = await this.rbsRepository.save(rbs);
        console.log('[CREATE RBS] Saved RBS:', JSON.stringify(saved, null, 2));
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'CREATE',
            entityType: 'RBS',
            entityId: saved.id,
            details: JSON.stringify(saved),
            tenantId: user.tenantId,
        });
        this.pollDeviceStatus(saved.id, 'rbs').catch((err) => console.error(`Initial poll failed for RBS ${saved.id}`, err));
        return saved;
    }
    async testRbsConnection(data) {
        const { ipAddress, monitoringMethod, apiUsername, apiPassword, apiPort, port, community } = data;
        try {
            if (monitoringMethod === 'api') {
                const client = await this.mikrotikApiService.connect({
                    host: ipAddress,
                    username: apiUsername,
                    password: apiPassword,
                    port: apiPort || 8728,
                    timeout: 5000
                });
                if (client) {
                    await this.mikrotikApiService.disconnect(ipAddress);
                    return {
                        success: true,
                        message: `Conexão API estabelecida com sucesso! (${ipAddress}:${apiPort || 8728})`
                    };
                }
                else {
                    throw new Error('Falha ao conectar via API');
                }
            }
            else if (monitoringMethod === 'snmp') {
                const snmp = require('net-snmp');
                const session = snmp.createSession(ipAddress, community || 'public', { port: port || 161, version: snmp.Version2c });
                const result = await new Promise((resolve, reject) => {
                    session.get(['1.3.6.1.2.1.1.1.0'], (error, varbinds) => {
                        session.close();
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(varbinds);
                        }
                    });
                });
                return {
                    success: true,
                    message: `Conexão SNMP estabelecida com sucesso! (${ipAddress}:${port || 161})`
                };
            }
            else if (monitoringMethod === 'ping') {
                const { exec } = require('child_process');
                const isWindows = process.platform === 'win32';
                const pingCommand = isWindows ? `ping -n 1 ${ipAddress}` : `ping -c 1 ${ipAddress}`;
                const result = await new Promise((resolve, reject) => {
                    exec(pingCommand, (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(stdout);
                        }
                    });
                });
                return {
                    success: true,
                    message: `Ping bem-sucedido! Dispositivo ${ipAddress} está respondendo.`
                };
            }
            throw new Error('Método de monitoramento inválido');
        }
        catch (error) {
            console.error('Test connection error:', error);
            throw new Error(error.message || 'Falha ao testar conexão');
        }
    }
    async disconnectRbs(id, tenantId) {
        const rbs = await this.rbsRepository.findOne({
            where: { id, tenantId },
            select: ['id', 'name', 'ipAddress', 'apiPort']
        });
        if (!rbs) {
            throw new common_1.NotFoundException('RBS not found');
        }
        try {
            await this.mikrotikApiService.disconnect(rbs.ipAddress, rbs.apiPort || 8728);
            this.logger.log(`[DISCONNECT] Manually disconnected from RBS ${rbs.name} (${rbs.ipAddress})`);
            return {
                success: true,
                message: `Desconectado de ${rbs.name} com sucesso!`
            };
        }
        catch (error) {
            this.logger.error(`[DISCONNECT] Failed to disconnect from ${rbs.ipAddress}: ${error.message}`);
            throw new Error('Falha ao desconectar: ' + error.message);
        }
    }
    async getOlts(projectId, tenantId) {
        return this.oltsRepository.find({ where: { projectId, tenantId } });
    }
    async getAllOlts(tenantId) {
        return this.oltsRepository.find({
            where: tenantId ? { tenantId } : {},
            relations: ['project'],
        });
    }
    async getOltById(id, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id, tenantId },
            relations: ['project'],
        });
        if (!olt) {
            throw new common_1.NotFoundException('OLT não encontrada');
        }
        return olt;
    }
    async getRbs(projectId, tenantId) {
        return this.rbsRepository.find({ where: { projectId, tenantId } });
    }
    async getAllRbs(tenantId) {
        return this.rbsRepository.find({
            where: tenantId ? { tenantId } : {},
            relations: ['project'],
        });
    }
    async getMonitoringData(tenantId) {
        const [olts, rbs] = await Promise.all([
            this.oltsRepository.find({
                where: tenantId ? { tenantId } : {},
                relations: ['project'],
            }),
            this.rbsRepository.find({
                where: tenantId ? { tenantId } : {},
                relations: ['project'],
            }),
        ]);
        const alarms = await this.alarmsRepository.find({
            where: {
                isAcknowledged: false,
                severity: 'critical',
                tenantId: tenantId ? tenantId : undefined,
            },
        });
        const alertingDeviceIds = new Set(alarms.map((a) => a.deviceId));
        const mappedOlts = olts.map((o) => ({
            ...o,
            type: 'olt',
            isAlerting: alertingDeviceIds.has(o.id),
            isInMaintenance: o.maintenanceUntil && new Date(o.maintenanceUntil) > new Date(),
        }));
        const mappedRbs = rbs.map((r) => ({
            ...r,
            type: 'rbs',
            isAlerting: alertingDeviceIds.has(r.id),
            isInMaintenance: r.maintenanceUntil && new Date(r.maintenanceUntil) > new Date(),
        }));
        return [...mappedOlts, ...mappedRbs];
    }
    async deleteOlt(id, user) {
        const olt = await this.oltsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!olt) {
            throw new common_1.NotFoundException('OLT não encontrada ou acesso negado.');
        }
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'DELETE',
            entityType: 'OLT',
            entityId: id,
            tenantId: user.tenantId,
        });
        return this.oltsRepository.remove(olt);
    }
    async updateOlt(id, data, user) {
        const olt = await this.oltsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!olt) {
            throw new common_1.NotFoundException('OLT não encontrada ou acesso negado.');
        }
        const allowedFields = [
            'name',
            'ipAddress',
            'latitude',
            'longitude',
            'port',
            'community',
            'model',
            'firmwareVersion',
            'projectId',
            'maintenanceUntil',
            'cliProtocol',
            'cliUsername',
            'cliPassword',
        ];
        const updateData = {};
        Object.keys(data).forEach((key) => {
            if (allowedFields.includes(key)) {
                if (key === 'cliPassword' && !data[key]) {
                    return;
                }
                updateData[key] = data[key];
            }
        });
        Object.assign(olt, updateData);
        const saved = await this.oltsRepository.save(olt);
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'UPDATE',
            entityType: 'OLT',
            entityId: id,
            details: JSON.stringify(updateData),
            tenantId: user.tenantId,
        });
        this.pollDeviceStatus(saved.id, 'olt').catch((err) => this.logger.error(`Poll failed after update for OLT ${id}`, err));
        this.runOltDiscovery(saved.id, user.tenantId).catch((err) => this.logger.error(`Automatic discovery failed after update for OLT ${id}`, err));
        return saved;
    }
    async deleteRbs(id, user) {
        const rbs = await this.rbsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!rbs) {
            throw new common_1.NotFoundException('RBS não encontrada ou acesso negado.');
        }
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'DELETE',
            entityType: 'RBS',
            entityId: id,
            tenantId: user.tenantId,
        });
        return this.rbsRepository.softDelete(id);
    }
    async updateRbs(id, data, user) {
        console.log('[UPDATE RBS] Received data for RBS', id, ':', JSON.stringify(data, null, 2));
        const rbs = await this.rbsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!rbs) {
            throw new common_1.NotFoundException('RBS não encontrada ou acesso negado.');
        }
        const allowedFields = [
            'name',
            'ipAddress',
            'latitude',
            'longitude',
            'port',
            'community',
            'model',
            'projectId',
            'maintenanceUntil',
            'monitoringMethod',
            'apiUsername',
            'apiPassword',
            'apiPort',
            'cliProtocol',
            'cliUsername',
            'cliPassword',
        ];
        const updateData = {};
        Object.keys(data).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = data[key];
            }
        });
        console.log('[UPDATE RBS] Filtered update data:', JSON.stringify(updateData, null, 2));
        Object.assign(rbs, updateData);
        const saved = await this.rbsRepository.save(rbs);
        console.log('[UPDATE RBS] Saved RBS:', JSON.stringify(saved, null, 2));
        await this.logAudit({
            userId: user.userId,
            userName: user.username,
            action: 'UPDATE',
            entityType: 'RBS',
            entityId: id,
            details: JSON.stringify(updateData),
            tenantId: user.tenantId,
        });
        this.pollDeviceStatus(saved.id, 'rbs').catch((err) => console.error(`Poll failed after update for RBS ${id}`, err));
        return saved;
    }
    async getRbsMonitoring(id, tenantId) {
        this.logger.debug(`[MONITORING] Fetching data for RBS ${id}`);
        const rbs = await this.rbsRepository.findOne({
            where: { id, tenantId },
            select: ['id', 'name', 'ipAddress', 'community', 'monitoringMethod', 'apiUsername', 'apiPassword', 'apiPort', 'tenantId']
        });
        if (!rbs)
            throw new common_1.NotFoundException('RBS not found');
        let health;
        let interfaces;
        let ethernetPorts = [];
        let status;
        let actualMethod = rbs.monitoringMethod;
        if (rbs.monitoringMethod === 'api' && rbs.apiUsername && rbs.apiPassword) {
            try {
                this.logger.log(`[MONITORING] Using MikroTik API for ${rbs.ipAddress}`);
                const [resourceStats, interfaceStats, ports] = await Promise.all([
                    this.mikrotikApiService.getResourceStats({
                        host: rbs.ipAddress,
                        username: rbs.apiUsername,
                        password: rbs.apiPassword,
                        port: rbs.apiPort,
                    }),
                    this.mikrotikApiService.getInterfaceStats({
                        host: rbs.ipAddress,
                        username: rbs.apiUsername,
                        password: rbs.apiPassword,
                        port: rbs.apiPort,
                    }),
                    this.mikrotikApiService.getEthernetPorts({
                        host: rbs.ipAddress,
                        username: rbs.apiUsername,
                        password: rbs.apiPassword,
                        port: rbs.apiPort,
                    }).catch(() => []),
                ]);
                health = {
                    cpuLoad: resourceStats.cpuLoad,
                    freeMemory: resourceStats.freeMemory,
                    totalMemory: resourceStats.totalMemory,
                    voltage: resourceStats.voltage || 0,
                    temperature: resourceStats.temperature || 0,
                };
                interfaces = interfaceStats.map(iface => ({
                    index: iface.index,
                    name: iface.name,
                    status: iface.status,
                    inOctets: iface.rxBytes,
                    outOctets: iface.txBytes,
                }));
                status = {
                    online: true,
                    uptime: resourceStats.uptime,
                };
                ethernetPorts = ports;
            }
            catch (error) {
                this.logger.error(`[MONITORING] API failed for ${rbs.ipAddress}, falling back to SNMP: ${error.message}`);
                actualMethod = 'snmp';
                [health, interfaces, status] = await Promise.all([
                    this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
                    this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
                    this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
                ]);
            }
        }
        else if (rbs.monitoringMethod === 'snmp') {
            this.logger.log(`[MONITORING] Using SNMP for ${rbs.ipAddress}`);
            [health, interfaces, status] = await Promise.all([
                this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
                this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
                this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
            ]);
        }
        else if (rbs.monitoringMethod === 'ping') {
            this.logger.log(`[MONITORING] Using Ping for ${rbs.ipAddress}`);
            const pingResult = await this.pingService.ping(rbs.ipAddress);
            health = {
                cpuLoad: 0,
                freeMemory: 0,
                totalMemory: 0,
                voltage: 0,
                temperature: 0,
            };
            interfaces = [];
            status = {
                online: pingResult.online,
                uptime: pingResult.online ? 'Online' : 'Offline',
            };
        }
        else {
            this.logger.log(`[MONITORING] No valid method configured, using SNMP for ${rbs.ipAddress}`);
            actualMethod = 'snmp';
            [health, interfaces, status] = await Promise.all([
                this.snmpService.getRbsHealth(rbs.ipAddress, rbs.community),
                this.snmpService.getRbsInterfaces(rbs.ipAddress, rbs.community),
                this.snmpService.getDeviceStatus(rbs.ipAddress, rbs.community),
            ]);
        }
        const alarms = await this.alarmsRepository.find({
            where: { deviceId: id },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        const result = {
            health: {
                ...health,
                uptime: status.uptime,
            },
            interfaces,
            ports: ethernetPorts,
            alarms,
            monitoringMethod: actualMethod,
        };
        this.monitoringGateway.broadcastDeviceUpdate(id, result);
        return result;
    }
    async syncOnus(oltId, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT not found');
        this.logger.log(`[SYNC] Starting ONU sync for OLT ${olt.name} (${olt.ipAddress})`);
        const onus = await this.snmpService.getOltOnus(olt.ipAddress, olt.community);
        this.logger.log(`[SYNC] Received ${onus.length} ONUs from SNMP service`);
        const ponCounts = onus.reduce((acc, onu) => {
            acc[onu.ponPort] = (acc[onu.ponPort] || 0) + 1;
            return acc;
        }, {});
        this.logger.log(`[SYNC] ONUs per PON port: ${JSON.stringify(ponCounts)}`);
        const scannedSerialNumbers = onus.map((o) => o.serialNumber);
        const updatedOnuIds = [];
        for (const data of onus) {
            const existingOnu = await this.onusRepository.findOne({
                where: { serialNumber: data.serialNumber, oltId: olt.id, tenantId },
            });
            if (existingOnu) {
                const newStatus = data.status || 'offline';
                const newSignal = data.signalLevel || 0;
                this.logger.log(`[SYNC] Updating ONU ${data.serialNumber}: Status ${existingOnu.status}->${newStatus}, Signal ${existingOnu.signalLevel}->${newSignal}. Port remains ${existingOnu.ponPort}`);
                await this.onusRepository.update(existingOnu.id, {
                    status: newStatus,
                    signalLevel: newSignal,
                    isAuthorized: true,
                    lastSeen: newStatus === 'online' ? new Date() : existingOnu.lastSeen,
                });
                updatedOnuIds.push(existingOnu.id);
            }
            else {
                const newOnu = this.onusRepository.create({
                    ...data,
                    oltId: olt.id,
                    tenantId,
                    isAuthorized: true,
                });
                const saved = await this.onusRepository.save(newOnu);
                updatedOnuIds.push(saved.id);
                this.logger.log(`[SYNC] Created new ONU: ${data.serialNumber} on PON ${data.ponPort}`);
            }
        }
        if (scannedSerialNumbers.length > 0) {
            const allDbOnus = await this.onusRepository.find({
                where: { oltId: olt.id, tenantId },
            });
            const missingCount = allDbOnus.filter((dbOnu) => !scannedSerialNumbers.includes(dbOnu.serialNumber)).length;
            if (missingCount > 0) {
                this.logger.debug(`[SYNC] Existem ${missingCount} ONUs no banco que não apareceram neste scan rápido de SNMP. Mantendo-as para evitar perda de dados CLI.`);
            }
        }
        this.logger.log(`[SYNC] Sync complete: ${onus.length} ONUs atualizadas de ${olt.ipAddress}`);
        return { success: true, count: onus.length, cleanedCount: 0 };
    }
    async getAllOnus(tenantId) {
        return this.onusRepository.find({
            where: { tenantId },
            relations: ['olt'],
            order: { ponPort: 'ASC', name: 'ASC' },
        });
    }
    async getOnus(oltId, tenantId) {
        return this.onusRepository.find({ where: { oltId, tenantId } });
    }
    async getOnusLive(oltId, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId },
            relations: ['project'],
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT not found');
        return this.oltDiscoveryService.getOnusLive(olt);
    }
    async deleteOnu(id, tenantId) {
        return this.onusRepository.softDelete({ id, tenantId });
    }
    async pollDeviceStatus(id, type) {
        let device = null;
        if (type === 'olt') {
            device = await this.oltsRepository.findOne({
                where: { id },
                relations: ['project'],
            });
        }
        else {
            device = await this.rbsRepository.findOne({
                where: { id },
                relations: ['project'],
            });
        }
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        const status = await this.snmpService.getDeviceStatus(device.ipAddress, device.community);
        const isInMaintenance = device.maintenanceUntil && new Date(device.maintenanceUntil) > new Date();
        if (!isInMaintenance) {
            if (device.status === 'online' && !status.online) {
                await this.generateAlarm({
                    type: `${type}_down`,
                    severity: 'critical',
                    deviceId: device.id,
                    deviceName: device.name,
                    message: `Equipamento ${device.name} está OFFLINE.`,
                    tenantId: device.project?.tenantId,
                });
            }
            else if (device.status === 'offline' && status.online) {
                await this.generateAlarm({
                    type: `${type}_up`,
                    severity: 'info',
                    deviceId: device.id,
                    deviceName: device.name,
                    message: `Equipamento ${device.name} voltou a ficar ONLINE.`,
                    tenantId: device.project?.tenantId,
                });
            }
        }
        const updateData = {
            uptime: status.uptime,
            status: status.online ? 'online' : 'offline',
        };
        if (status.online) {
            updateData.lastSeen = new Date();
        }
        if (type === 'olt') {
            await this.oltsRepository.update(id, updateData);
        }
        else {
            let health = {
                cpuLoad: 0,
                freeMemory: 0,
                totalMemory: 0,
                voltage: 0,
                temperature: 0,
            };
            if (!status.icmpOnly) {
                health = await this.snmpService.getRbsHealth(device.ipAddress, device.community);
            }
            await this.rbsRepository.update(id, {
                ...updateData,
                cpuLoad: health.cpuLoad,
                freeMemory: health.freeMemory,
                totalMemory: health.totalMemory,
                voltage: health.voltage,
                temperature: health.temperature,
            });
            return { ...device, ...status, ...health };
        }
        return { ...device, ...status };
    }
    async getAlarms(tenantId) {
        return this.alarmsRepository.find({
            where: tenantId ? { tenantId } : {},
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async acknowledgeAlarm(id, userId, userName, tenantId) {
        return this.alarmsRepository.update({ id, tenantId }, {
            isAcknowledged: true,
            acknowledgedBy: userName,
            acknowledgedAt: new Date(),
        });
    }
    async generateAlarm(data) {
        const alarm = this.alarmsRepository.create(data);
        return this.alarmsRepository.save(alarm);
    }
    async logAudit(data) {
        const log = this.auditLogsRepository.create(data);
        return this.auditLogsRepository.save(log);
    }
    async tracePath(startElementId, startFiberIndex, tenantId) {
        const path = [];
        const visited = new Set();
        const queue = [];
        const startSplitter = await this.splittersRepository.findOne({
            where: { id: startElementId },
        });
        if (startSplitter) {
            if (startFiberIndex === 1) {
                queue.push({
                    id: startElementId,
                    type: 'splitter',
                    fiberIndex: 1,
                    side: 'input',
                });
                queue.push({
                    id: startElementId,
                    type: 'splitter',
                    fiberIndex: 1,
                    side: 'output',
                });
            }
            else {
                queue.push({
                    id: startElementId,
                    type: 'splitter',
                    fiberIndex: startFiberIndex,
                    side: 'output',
                });
            }
        }
        else {
            const startCable = await this.cablesRepository.findOne({
                where: { id: startElementId },
            });
            if (startCable) {
                queue.push({
                    id: startElementId,
                    type: 'cable',
                    fiberIndex: startFiberIndex,
                    side: 'neutral',
                });
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current)
                break;
            const key = `${current.id}-${current.fiberIndex}-${current.type}-${current.side}`;
            if (visited.has(key))
                continue;
            visited.add(key);
            path.push(current);
            if (current.type === 'cable') {
                const cable = await this.cablesRepository.findOne({
                    where: { id: current.id },
                });
                if (!cable)
                    continue;
                const queueNeighbor = (id, type, index, isDestination) => {
                    let nextSide = 'neutral';
                    if (type === 'splitter') {
                        if (isDestination)
                            nextSide = 'input';
                        else
                            nextSide = 'output';
                    }
                    queue.push({ id, type, fiberIndex: index, side: nextSide });
                };
                await this.findFailoverConnectionsEnhanced(current.id, current.fiberIndex, queueNeighbor);
            }
            else if (current.type === 'splitter') {
                const splitter = await this.splittersRepository.findOne({
                    where: { id: current.id },
                });
                if (!splitter)
                    continue;
                const capacity = parseInt(splitter.type.split(':')[1]) || 8;
                if (current.side === 'input') {
                    for (let i = 1; i <= capacity; i++) {
                        queue.push({
                            id: current.id,
                            type: 'splitter',
                            fiberIndex: i,
                            side: 'output',
                        });
                    }
                    await this.findSplitterConnections(current.id, current.fiberIndex, 'destination', queue);
                }
                else if (current.side === 'output') {
                    queue.push({
                        id: current.id,
                        type: 'splitter',
                        fiberIndex: 1,
                        side: 'input',
                    });
                    await this.findSplitterConnections(current.id, current.fiberIndex, 'origin', queue);
                }
            }
        }
        return path;
    }
    async findFailoverConnectionsEnhanced(cableId, fiberIdx, queueFn) {
        const fusions = await this.fusionsRepository.find({
            where: [
                { originId: cableId, originFiberIndex: fiberIdx },
                { destinationId: cableId, destinationFiberIndex: fiberIdx },
            ],
        });
        for (const f of fusions) {
            if (f.originId === cableId) {
                queueFn(f.destinationId, f.destinationType, f.destinationFiberIndex, true);
            }
            else {
                queueFn(f.originId, f.originType, f.originFiberIndex, false);
            }
        }
    }
    async findSplitterConnections(splitterId, fiberIdx, role, queue) {
        const whereClause = role === 'destination'
            ? { destinationId: splitterId, destinationFiberIndex: fiberIdx }
            : { originId: splitterId, originFiberIndex: fiberIdx };
        const fusions = await this.fusionsRepository.find({ where: whereClause });
        for (const f of fusions) {
            if (role === 'destination') {
                let nextSide = 'neutral';
                if (f.originType === 'splitter')
                    nextSide = 'output';
                queue.push({
                    id: f.originId,
                    type: f.originType,
                    fiberIndex: f.originFiberIndex,
                    side: nextSide,
                });
            }
            else {
                let nextSide = 'neutral';
                if (f.destinationType === 'splitter')
                    nextSide = 'input';
                queue.push({
                    id: f.destinationId,
                    type: f.destinationType,
                    fiberIndex: f.destinationFiberIndex,
                    side: nextSide,
                });
            }
        }
    }
    async removeAllByProject(projectId, tenantId) {
        const project = await this.projectsService.findOne(projectId, { tenantId });
        if (!project)
            throw new common_1.NotFoundException('Project not found or access denied');
        try {
            const boxes = await this.boxesRepository.find({
                where: { projectId },
                select: ['id'],
            });
            const boxIds = boxes.map((b) => b.id);
            if (boxIds.length > 0) {
                await this.fusionsRepository.delete({ boxId: (0, typeorm_2.In)(boxIds) });
                await this.splittersRepository.delete({ boxId: (0, typeorm_2.In)(boxIds) });
            }
            await this.fusionsRepository.delete({ projectId });
            await this.splittersRepository.delete({ projectId });
            await this.cablesRepository.delete({ projectId });
            await this.onusRepository.delete({ projectId });
            await this.ctoCustomersRepository.delete({ projectId });
            await this.boxesRepository.delete({ projectId });
            await this.polesRepository.delete({ projectId });
            await this.rbsRepository.delete({ projectId });
            await this.oltsRepository.delete({ projectId });
            return { success: true, message: 'Project cleaned up successfully' };
        }
        catch (error) {
            console.error('Error cleaning project:', error);
            throw error;
        }
    }
    async calculateLinkBudget(cableId, fiberIndex, tenantId) {
        const path = await this.tracePath(cableId, fiberIndex, tenantId);
        const firstCable = await this.cablesRepository.findOne({ where: { id: cableId } });
        const project = firstCable ? await this.projectsService.findOne(firstCable.projectId, { tenantId }) : null;
        const settings = project?.settings;
        const fiberLossPerKm = settings?.opticalLoss?.fiberPerKm || 0.35;
        const fiberLossPerMeter = fiberLossPerKm / 1000;
        const defaultOltPower = settings?.opticalLoss?.oltPower || 3.0;
        const fusionLoss = settings?.opticalLoss?.fusion || 0.1;
        let totalLoss = 0;
        let totalDistance = 0;
        const events = [];
        let isPathAsBuilt = true;
        for (const item of path) {
            if (item.type === 'cable') {
                const cable = await this.cablesRepository.findOne({
                    where: { id: item.id },
                });
                if (cable) {
                    const length = this.calculateCableLength(cable);
                    const cableLoss = length * fiberLossPerMeter;
                    totalLoss += cableLoss;
                    totalDistance += length;
                    if (cable.status !== 'built')
                        isPathAsBuilt = false;
                    events.push({
                        type: 'cable',
                        description: `Cabo ${cable.type.toUpperCase()} (${length.toFixed(1)}m)`,
                        loss: cableLoss,
                        status: cable.status
                    });
                }
            }
            else if (item.type === 'splitter') {
                const splitter = await this.splittersRepository.findOne({
                    where: { id: item.id },
                });
                if (splitter) {
                    const ratio = splitter.type.split(':')[1];
                    const losses = {
                        '2': 3.5,
                        '4': 7.0,
                        '8': 10.5,
                        '16': 14.1,
                        '32': 17.5,
                    };
                    const loss = losses[ratio] || 10.5;
                    totalLoss += loss;
                    events.push({
                        type: 'splitter',
                        description: `Splitter 1:${ratio}`,
                        loss: loss,
                    });
                }
            }
            if (item !== path[0]) {
                totalLoss += fusionLoss;
                events.push({
                    type: 'fusion',
                    description: 'Fusão / Conexão',
                    loss: fusionLoss,
                });
            }
        }
        const estimatedSignal = parseFloat((defaultOltPower - totalLoss).toFixed(2));
        let status = 'optimal';
        if (estimatedSignal < -28)
            status = 'critical';
        else if (estimatedSignal < -25)
            status = 'warning';
        return {
            totalLoss: parseFloat(totalLoss.toFixed(2)),
            totalDistance: parseFloat(totalDistance.toFixed(1)),
            estimatedSignal,
            status,
            isAsBuilt: isPathAsBuilt,
            events,
        };
    }
    calculateCableLength(cable) {
        let length = 0;
        if (cable.points && Array.isArray(cable.points)) {
            for (let i = 0; i < cable.points.length - 1; i++) {
                const p1 = cable.points[i];
                const p2 = cable.points[i + 1];
                const R = 6371e3;
                const φ1 = (p1.lat * Math.PI) / 180;
                const φ2 = (p2.lat * Math.PI) / 180;
                const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
                const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const circle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                length += R * circle;
            }
        }
        return length + (cable.slack || 0);
    }
    async getTechnicalMemorial(projectId, user) {
        const project = await this.projectsService.findOne(projectId, user);
        if (!project)
            throw new common_1.NotFoundException('Project not found or access denied');
        const [poles, boxes, cables, splitters, onus] = await Promise.all([
            this.polesRepository.count({ where: { projectId } }),
            this.boxesRepository.find({ where: { projectId } }),
            this.cablesRepository.find({ where: { projectId } }),
            this.splittersRepository.find({ where: { projectId } }),
            this.onusRepository.find({ where: { projectId } }),
        ]);
        const boxTypes = {};
        boxes.forEach((b) => {
            boxTypes[b.type] = (boxTypes[b.type] || 0) + 1;
        });
        const cableMeters = {};
        cables.forEach((c) => {
            const length = this.calculateCableLength(c);
            cableMeters[c.type] = (cableMeters[c.type] || 0) + length;
        });
        const defaultPrices = {
            pole: 350,
            poleRental: 15.0,
            box: { cto: 180, ce: 120, reserve: 80 },
            cable: { as80: 2.5, as120: 3.5, underground: 5.0, drop: 1.2 },
            activation: 150.0,
        };
        const prices = (project.settings?.prices || defaultPrices);
        const bom = [];
        let grandTotal = 0;
        const poleTotal = poles * (prices.pole || defaultPrices.pole);
        bom.push({
            item: 'Posteação (Aquisição)',
            quantity: poles,
            unit: 'un',
            unitPrice: prices.pole || defaultPrices.pole,
            total: poleTotal,
        });
        grandTotal += poleTotal;
        const rentalUnitPrice = prices.poleRental || defaultPrices.poleRental;
        const rentalTotal = poles * rentalUnitPrice;
        bom.push({
            item: 'Aluguel de Postes (Ocupação)',
            quantity: poles,
            unit: 'un',
            unitPrice: rentalUnitPrice,
            total: rentalTotal,
        });
        grandTotal += rentalTotal;
        Object.entries(boxTypes).forEach(([type, count]) => {
            const unitPrice = (prices.box && prices.box[type]) ||
                defaultPrices.box[type] ||
                150;
            const total = count * unitPrice;
            bom.push({
                item: `Caixa ${type.toUpperCase()}`,
                quantity: count,
                unit: 'un',
                unitPrice,
                total,
            });
            grandTotal += total;
        });
        Object.entries(cableMeters).forEach(([type, meters]) => {
            const unitPrice = (prices.cable && prices.cable[type]) ||
                defaultPrices.cable[type] ||
                2.0;
            const total = meters * unitPrice;
            bom.push({
                item: `Cabo ${type.toUpperCase()}`,
                quantity: parseFloat(meters.toFixed(1)),
                unit: 'm',
                unitPrice,
                total,
            });
            grandTotal += total;
        });
        const activationPrice = prices.activation || defaultPrices.activation;
        const activationTotal = onus.length * activationPrice;
        bom.push({
            item: 'Ativação de Cliente (ONU/Drop)',
            quantity: onus.length,
            unit: 'un',
            unitPrice: activationPrice,
            total: activationTotal,
        });
        grandTotal += activationTotal;
        return {
            projectName: project.name,
            customer: project.tenant?.name || project.tenantId,
            status: project.status,
            date: new Date(),
            summary: {
                totalPoles: poles,
                totalBoxes: boxes.length,
                totalCablesMeters: Object.values(cableMeters).reduce((a, b) => a + b, 0),
                totalSplitters: splitters.length,
                totalCustomers: onus.length,
            },
            details: {
                boxes: boxTypes,
                cables: cableMeters,
            },
            bom: {
                items: bom,
                grandTotal,
            },
        };
    }
    async getProjectDifferential(projectId, tenantId) {
        const project = await this.projectsService.findOne(projectId, { tenantId });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        const [poles, boxes, cables] = await Promise.all([
            this.polesRepository.find({ where: { projectId } }),
            this.boxesRepository.find({ where: { projectId } }),
            this.cablesRepository.find({ where: { projectId } }),
        ]);
        const stats = {
            poles: {
                total: poles.length,
                built: poles.filter(p => p.status === 'built' || p.status === 'active').length,
                projetado: poles.filter(p => p.status === 'draft' || !p.status).length,
            },
            boxes: {
                total: boxes.length,
                built: boxes.filter(b => b.status === 'built' || b.status === 'active').length,
                projetado: boxes.filter(b => b.status === 'draft' || !b.status).length,
            },
            cables: {
                totalMeters: 0,
                builtMeters: 0,
                projetadoMeters: 0,
            }
        };
        cables.forEach(c => {
            const length = this.calculateCableLength(c);
            stats.cables.totalMeters += length;
            if (c.status === 'built' || c.status === 'active') {
                stats.cables.builtMeters += length;
            }
            else {
                stats.cables.projetadoMeters += length;
            }
        });
        return {
            projectId,
            projectName: project.name,
            stats,
            executionPercentage: stats.poles.total > 0 ? (stats.poles.built / stats.poles.total) * 100 : 0,
            summary: `Projeto ${project.name}: ${stats.poles.built}/${stats.poles.total} postes executados.`
        };
    }
    async addBoxImage(boxId, imageUrl) {
        const box = await this.boxesRepository.findOne({ where: { id: boxId } });
        if (!box)
            throw new common_1.NotFoundException('Box not found');
        const images = box.images || [];
        images.push(imageUrl);
        box.images = images;
        return this.boxesRepository.save(box);
    }
    async getAuditLogs(tenantId) {
        return this.auditLogsRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async getNetworkAnalytics(tenantId) {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const completedWOs = await this.workOrdersRepository.find({
            where: { tenantId, status: 'COMPLETED' },
            select: ['createdAt', 'completedAt'],
        });
        let totalResolutionTime = 0;
        completedWOs.forEach((wo) => {
            if (wo.completedAt) {
                totalResolutionTime +=
                    wo.completedAt.getTime() - wo.createdAt.getTime();
            }
        });
        const mttrHours = completedWOs.length > 0
            ? totalResolutionTime / completedWOs.length / (1000 * 60 * 60)
            : 0;
        const onus = await this.onusRepository.find({
            where: { tenantId, isAuthorized: true },
            select: ['id', 'createdAt'],
        });
        const growthMap = new Map();
        onus.forEach((onu) => {
            const month = onu.createdAt.toISOString().slice(0, 7);
            growthMap.set(month, (growthMap.get(month) || 0) + 1);
        });
        const growthData = Array.from(growthMap.entries())
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));
        const techStats = await this.workOrdersRepository
            .createQueryBuilder('wo')
            .select('wo.technicianName', 'name')
            .addSelect('COUNT(wo.id)', 'completed')
            .where('wo.tenantId = :tenantId', { tenantId })
            .andWhere('wo.status = :status', { status: 'COMPLETED' })
            .groupBy('wo.technicianName')
            .getRawMany();
        return {
            mttrHours: parseFloat(mttrHours.toFixed(2)),
            growthData,
            techStats,
            totalWorkOrders: await this.workOrdersRepository.count({
                where: { tenantId },
            }),
        };
    }
    async createWorkOrder(data, user) {
        const wo = this.workOrdersRepository.create({
            ...data,
            tenantId: user.tenantId,
            status: 'PENDING',
        });
        return this.workOrdersRepository.save(wo);
    }
    async getWorkOrders(tenantId) {
        return this.workOrdersRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async updateWorkOrder(id, data, tenantId) {
        await this.workOrdersRepository.update({ id, tenantId }, data);
        return this.workOrdersRepository.findOne({ where: { id, tenantId } });
    }
    async deleteWorkOrder(id, tenantId) {
        return this.workOrdersRepository.delete({ id, tenantId });
    }
    async rebootOnu(onuId, tenantId) {
        const onu = await this.onusRepository.findOne({
            where: { id: onuId, tenantId },
            relations: ['olt'],
        });
        if (!onu)
            throw new common_1.NotFoundException('ONU não encontrada');
        await this.snmpService.rebootOnu(onu.olt.ipAddress, onu.olt.community, onu.ponPort, onu.serialNumber);
        return {
            success: true,
            message: `Comando de reboot enviado para ONU ${onu.serialNumber}`,
        };
    }
    async bulkRebootOnus(onuIds, tenantId) {
        this.logger.log(`[BULK] Rebooting ${onuIds.length} ONUs for tenant ${tenantId}`);
        const results = [];
        for (const id of onuIds) {
            try {
                await this.rebootOnu(id, tenantId);
                results.push({ id, success: true });
            }
            catch (error) {
                this.logger.error(`Failed to reboot ONU ${id}:`, error);
                results.push({ id, success: false, error: error.message });
            }
        }
        return { success: true, processed: results.length, results };
    }
    async authorizeOnu(onuId, tenantId) {
        const onu = await this.onusRepository.findOne({
            where: { id: onuId, tenantId },
            relations: ['olt'],
        });
        if (!onu)
            throw new common_1.NotFoundException('ONU não encontrada');
        await this.snmpService.authorizeOnu(onu.olt.ipAddress, onu.olt.community, onu.ponPort, onu.serialNumber);
        await this.onusRepository.update(onuId, { isAuthorized: true });
        return {
            success: true,
            message: `ONU ${onu.serialNumber} autorizada com sucesso`,
        };
    }
    async bulkAuthorizeOnus(onuIds, tenantId) {
        this.logger.log(`[BULK] Authorizing ${onuIds.length} ONUs for tenant ${tenantId}`);
        const results = [];
        for (const id of onuIds) {
            try {
                await this.authorizeOnu(id, tenantId);
                results.push({ id, success: true });
            }
            catch (error) {
                this.logger.error(`Failed to authorize ONU ${id}:`, error);
                results.push({ id, success: false, error: error.message });
            }
        }
        return { success: true, processed: results.length, results };
    }
    async updateOnu(id, data, tenantId) {
        const onu = await this.onusRepository.findOne({
            where: { id, tenantId },
            relations: ['olt'],
        });
        if (!onu)
            throw new common_1.NotFoundException('ONU não encontrada');
        if (data.name && data.name !== onu.name) {
            try {
                await this.snmpService.setOnuName(onu.olt.ipAddress, onu.olt.community, onu.ponPort, onu.serialNumber, data.name);
            }
            catch (e) {
                console.error('Failed to update ONU name on hardware:', e);
            }
        }
        await this.onusRepository.update({ id, tenantId }, data);
        return this.onusRepository.findOne({ where: { id, tenantId } });
    }
    async runOltDiscovery(oltId, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT not found');
        this.logger.log(`[OLT_DISCOVERY] Starting discovery for OLT ${olt.name}`);
        const result = await this.oltDiscoveryService.discoverOlt(oltId);
        this.logger.log(`[OLT_DISCOVERY] Completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        return result;
    }
    async getOltDiscovery(oltId, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT not found');
        return {
            capabilities: olt.capabilities,
            discoveryResults: olt.discoveryResults,
            sysDescr: olt.sysDescr,
            sysObjectID: olt.sysObjectID,
        };
    }
    async getOltPonPorts(oltId, tenantId) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT not found');
        return await this.ponPortsRepository.find({
            where: { oltId, tenantId },
            order: { ifIndex: 'ASC' },
        });
    }
    isOltDiscoveryActive(oltId) {
        return this.oltDiscoveryService.isDiscoveryActive(oltId);
    }
    isOltIpDiscoveryActive(ip) {
        return this.oltDiscoveryService.isIpDiscoveryActive(ip);
    }
    async testOltCliConnection(data) {
        const { ipAddress, cliProtocol, cliUsername, cliPassword, id } = data;
        this.logger.log(`[CLI_TEST] Testando conexão ${cliProtocol.toUpperCase()} para ${ipAddress}...`);
        try {
            let password = cliPassword;
            if (!password && id) {
                const olt = await this.oltsRepository
                    .createQueryBuilder('olt')
                    .addSelect('olt.cliPassword')
                    .where('olt.id = :id', { id })
                    .getOne();
                password = olt?.cliPassword;
            }
            if (!password) {
                throw new Error('Senha não fornecida e nenhuma senha salva encontrada.');
            }
            const command = 'show version';
            const output = await this.oltCliService.executeCommand(ipAddress, cliProtocol, { username: cliUsername, password }, command);
            this.logger.log(`[CLI_TEST] Sucesso na conexão com ${ipAddress}`);
            return {
                success: true,
                message: 'Conexão estabelecida com sucesso!',
                output: output.substring(0, 100),
            };
        }
        catch (error) {
            this.logger.error(`[CLI_TEST] Falha na conexão com ${ipAddress}: ${error.message}`);
            return { success: false, message: `Falha na conexão: ${error.message}` };
        }
    }
    async applyOltTemplate(oltId, templateType, user) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId: user.tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT não encontrada.');
        this.logger.log(`[TIPO_FACIL] Aplicando modelo "${templateType}" para OLT ${olt.name}`);
        await this.ponPortsRepository.delete({ oltId });
        const newPorts = [];
        if (templateType === 'cianet_8pon' || templateType === 'generic_8pon') {
            for (let i = 1; i <= 8; i++) {
                newPorts.push(this.ponPortsRepository.create({
                    oltId,
                    ifIndex: 100 + i,
                    ifDescr: `PON 1/1/${i}`,
                    ifOperStatus: 1,
                    tenantId: user.tenantId,
                }));
            }
        }
        else if (templateType === 'generic_16pon') {
            for (let i = 1; i <= 16; i++) {
                newPorts.push(this.ponPortsRepository.create({
                    oltId,
                    ifIndex: 100 + i,
                    ifDescr: `PON 1/1/${i}`,
                    ifOperStatus: 1,
                    tenantId: user.tenantId,
                }));
            }
        }
        else {
            throw new Error('Modelo desconhecido.');
        }
        await this.ponPortsRepository.save(newPorts);
        olt.discoveryResults = {
            lastRun: new Date(),
            status: 'success',
            errors: [`Modelo ${templateType} aplicado manualmente`],
        };
        await this.oltsRepository.save(olt);
        return { success: true, count: newPorts.length };
    }
    async createManualPonPort(oltId, data, user) {
        const olt = await this.oltsRepository.findOne({
            where: { id: oltId, tenantId: user.tenantId },
        });
        if (!olt)
            throw new common_1.NotFoundException('OLT não encontrada.');
        const port = this.ponPortsRepository.create({
            ...data,
            oltId,
            tenantId: user.tenantId,
            ifOperStatus: 1,
        });
        return this.ponPortsRepository.save(port);
    }
    async deletePonPort(id, user) {
        const port = await this.ponPortsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
        if (!port)
            throw new common_1.NotFoundException('Porta PON não encontrada.');
        return this.ponPortsRepository.remove(port);
    }
    async getExpansionSuggestions(projectId) {
        const onus = await this.onusRepository.find({ where: { projectId } });
        const boxes = await this.boxesRepository.find({ where: { projectId } });
        const ctoBoxes = boxes.filter((b) => b.type === 'cto' || b.type === 'termination');
        const uncoveredOnus = onus.filter((onu) => {
            return !ctoBoxes.some((cto) => {
                const dist = this.calculateDistance(onu.latitude, onu.longitude, cto.latitude, cto.longitude);
                return dist < 200;
            });
        });
        if (uncoveredOnus.length === 0)
            return [];
        const clusters = [];
        const processed = new Set();
        for (const onu of uncoveredOnus) {
            if (processed.has(onu.id))
                continue;
            const cluster = [onu];
            processed.add(onu.id);
            for (const other of uncoveredOnus) {
                if (processed.has(other.id))
                    continue;
                const dist = this.calculateDistance(onu.latitude, onu.longitude, other.latitude, other.longitude);
                if (dist < 300) {
                    cluster.push(other);
                    processed.add(other.id);
                }
            }
            clusters.push(cluster);
        }
        return clusters
            .filter((c) => c.length >= 3)
            .map((c) => {
            const avgLat = c.reduce((sum, o) => sum + o.latitude, 0) / c.length;
            const avgLng = c.reduce((sum, o) => sum + o.longitude, 0) / c.length;
            return {
                latitude: avgLat,
                longitude: avgLng,
                uncoveredCount: c.length,
                reason: `Cluster de ${c.length} clientes desatendidos`,
                type: 'suggested_cto',
            };
        });
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.NetworkElementsService = NetworkElementsService;
exports.NetworkElementsService = NetworkElementsService = NetworkElementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pole_entity_1.Pole)),
    __param(1, (0, typeorm_1.InjectRepository)(box_entity_1.InfrastructureBox)),
    __param(2, (0, typeorm_1.InjectRepository)(cable_entity_1.Cable)),
    __param(3, (0, typeorm_1.InjectRepository)(splitter_entity_1.Splitter)),
    __param(4, (0, typeorm_1.InjectRepository)(fusion_entity_1.Fusion)),
    __param(5, (0, typeorm_1.InjectRepository)(olt_entity_1.Olt)),
    __param(6, (0, typeorm_1.InjectRepository)(onu_entity_1.Onu)),
    __param(7, (0, typeorm_1.InjectRepository)(pon_port_entity_1.PonPort)),
    __param(8, (0, typeorm_1.InjectRepository)(rbs_entity_1.Rbs)),
    __param(9, (0, typeorm_1.InjectRepository)(alarm_entity_1.Alarm)),
    __param(10, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(11, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __param(12, (0, typeorm_1.InjectRepository)(cto_customer_entity_1.CtoCustomer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        snmp_service_1.SnmpService,
        olt_discovery_service_1.OltDiscoveryService,
        olt_cli_service_1.OltCliService,
        mikrotik_api_service_1.MikrotikApiService,
        monitoring_gateway_1.MonitoringGateway,
        ping_service_1.PingService,
        projects_service_1.ProjectsService])
], NetworkElementsService);
//# sourceMappingURL=network-elements.service.js.map