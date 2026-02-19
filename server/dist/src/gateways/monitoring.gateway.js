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
var MonitoringGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const port_monitoring_service_1 = require("../services/port-monitoring.service");
const network_elements_service_1 = require("../network-elements/network-elements.service");
let MonitoringGateway = MonitoringGateway_1 = class MonitoringGateway {
    portMonitoringService;
    networkElementsService;
    server;
    logger = new common_1.Logger(MonitoringGateway_1.name);
    deviceSubscriptions = new Map();
    constructor(portMonitoringService, networkElementsService) {
        this.portMonitoringService = portMonitoringService;
        this.networkElementsService = networkElementsService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.deviceSubscriptions.forEach((subscribers, deviceId) => {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
                this.deviceSubscriptions.delete(deviceId);
            }
        });
    }
    handleSubscribe(client, data) {
        const { deviceId } = data;
        if (!this.deviceSubscriptions.has(deviceId)) {
            this.deviceSubscriptions.set(deviceId, new Set());
        }
        const subscribers = this.deviceSubscriptions.get(deviceId);
        subscribers.add(client.id);
        client.join(`device:${deviceId}`);
        this.logger.log(`Client ${client.id} subscribed to device ${deviceId}`);
        this.networkElementsService.getAllRbs().then(rbsList => {
            const rb = rbsList.find(r => r.id === deviceId);
            if (rb) {
                this.networkElementsService.getRbsMonitoring(rb.id, rb.tenantId);
            }
        }).catch(err => this.logger.error(`Error triggering immediate RBS update: ${err.message}`));
        if (subscribers.size === 1) {
            this.portMonitoringService.startMonitoring(deviceId);
        }
        return { success: true, deviceId };
    }
    handleUnsubscribe(client, data) {
        const { deviceId } = data;
        const subscribers = this.deviceSubscriptions.get(deviceId);
        if (subscribers) {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
                this.deviceSubscriptions.delete(deviceId);
                this.portMonitoringService.stopMonitoring(deviceId);
            }
        }
        this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
        return { success: true, deviceId };
    }
    broadcastDeviceUpdate(deviceId, data) {
        const subscribers = this.deviceSubscriptions.get(deviceId);
        if (subscribers && subscribers.size > 0) {
            subscribers.forEach((socketId) => {
                this.server.to(socketId).emit('device-update', {
                    deviceId,
                    data,
                    timestamp: new Date(),
                });
            });
            this.logger.debug(`Broadcasted update for device ${deviceId} to ${subscribers.size} clients`);
        }
    }
    broadcastDeviceStatus(deviceId, status) {
        this.server.emit('device-status', {
            deviceId,
            status,
            timestamp: new Date(),
        });
        this.logger.log(`Broadcasted status change for device ${deviceId}: ${status}`);
    }
    getDeviceSubscribers(deviceId) {
        return this.deviceSubscriptions.get(deviceId)?.size || 0;
    }
    hasSubscribers(deviceId) {
        return this.getDeviceSubscribers(deviceId) > 0;
    }
};
exports.MonitoringGateway = MonitoringGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MonitoringGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MonitoringGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], MonitoringGateway.prototype, "handleUnsubscribe", null);
exports.MonitoringGateway = MonitoringGateway = MonitoringGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/monitoring',
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => port_monitoring_service_1.PortMonitoringService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => network_elements_service_1.NetworkElementsService))),
    __metadata("design:paramtypes", [port_monitoring_service_1.PortMonitoringService,
        network_elements_service_1.NetworkElementsService])
], MonitoringGateway);
//# sourceMappingURL=monitoring.gateway.js.map