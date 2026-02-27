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
var PortMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mikrotik_api_service_1 = require("./mikrotik-api.service");
const monitoring_gateway_1 = require("../gateways/monitoring.gateway");
const rbs_entity_1 = require("../network-elements/entities/rbs.entity");
let PortMonitoringService = PortMonitoringService_1 = class PortMonitoringService {
    rbsRepository;
    mikrotikApiService;
    monitoringGateway;
    logger = new common_1.Logger(PortMonitoringService_1.name);
    trafficPollers = new Map();
    statusPollers = new Map();
    deviceConfigs = new Map();
    lastPortStatus = new Map();
    constructor(rbsRepository, mikrotikApiService, monitoringGateway) {
        this.rbsRepository = rbsRepository;
        this.mikrotikApiService = mikrotikApiService;
        this.monitoringGateway = monitoringGateway;
    }
    async startMonitoring(deviceId, tenantId) {
        if (this.trafficPollers.has(deviceId)) {
            return;
        }
        const rbs = await this.rbsRepository.findOne({ where: { id: deviceId } });
        if (!rbs || rbs.monitoringMethod !== 'api' || !rbs.apiUsername || !rbs.apiPassword) {
            this.logger.warn(`Cannot start port monitoring for device ${deviceId}: Missing API config`);
            return;
        }
        const config = {
            host: rbs.ipAddress,
            username: rbs.apiUsername,
            password: rbs.apiPassword,
            port: rbs.apiPort || 8728,
        };
        this.deviceConfigs.set(deviceId, config);
        this.logger.log(`Starting high-frequency port monitoring for device ${deviceId}`);
        await this.pollStatus(deviceId);
        const trafficPoller = setInterval(() => this.pollTraffic(deviceId), 1500);
        this.trafficPollers.set(deviceId, trafficPoller);
        const statusPoller = setInterval(() => this.pollStatus(deviceId), 4000);
        this.statusPollers.set(deviceId, statusPoller);
    }
    async stopMonitoring(deviceId) {
        this.logger.log(`Stopping port monitoring for device ${deviceId}`);
        if (this.trafficPollers.has(deviceId)) {
            clearInterval(this.trafficPollers.get(deviceId));
            this.trafficPollers.delete(deviceId);
        }
        if (this.statusPollers.has(deviceId)) {
            clearInterval(this.statusPollers.get(deviceId));
            this.statusPollers.delete(deviceId);
        }
        this.deviceConfigs.delete(deviceId);
        this.lastPortStatus.delete(deviceId);
    }
    async pollTraffic(deviceId) {
        const config = this.deviceConfigs.get(deviceId);
        if (!config)
            return;
        try {
            const ports = this.lastPortStatus.get(deviceId) || [];
            if (ports.length === 0)
                return;
            const trafficResults = await Promise.all(ports.map(async (port) => {
                return this.mikrotikApiService.monitorPortTraffic(config, port.name);
            }));
            this.monitoringGateway.server.to(`device:${deviceId}`).emit('port-traffic', {
                deviceId,
                traffic: trafficResults,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.logger.error(`Error polling traffic for device ${deviceId}: ${error.message}`);
        }
    }
    async pollStatus(deviceId) {
        const config = this.deviceConfigs.get(deviceId);
        if (!config)
            return;
        try {
            const ports = await this.mikrotikApiService.getEthernetPorts(config);
            this.lastPortStatus.set(deviceId, ports);
            this.monitoringGateway.server.to(`device:${deviceId}`).emit('port-status', {
                deviceId,
                ports,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.logger.error(`Error polling status for device ${deviceId}: ${error.message}`);
        }
    }
};
exports.PortMonitoringService = PortMonitoringService;
exports.PortMonitoringService = PortMonitoringService = PortMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rbs_entity_1.Rbs)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => monitoring_gateway_1.MonitoringGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mikrotik_api_service_1.MikrotikApiService,
        monitoring_gateway_1.MonitoringGateway])
], PortMonitoringService);
//# sourceMappingURL=port-monitoring.service.js.map