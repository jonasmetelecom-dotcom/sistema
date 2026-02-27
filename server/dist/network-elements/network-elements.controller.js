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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkElementsController = void 0;
const common_1 = require("@nestjs/common");
const network_elements_service_1 = require("./network-elements.service");
let NetworkElementsController = class NetworkElementsController {
    networkElementsService;
    constructor(networkElementsService) {
        this.networkElementsService = networkElementsService;
    }
    findAllByProject(projectId, req) {
        return this.networkElementsService.findAllByProject(projectId, req.user);
    }
    createPole(data) {
        return this.networkElementsService.createPole(data);
    }
    createBox(data) {
        return this.networkElementsService.createBox(data);
    }
    findOneBox(id) {
        return this.networkElementsService.findOneBox(id);
    }
    createCable(data) {
        return this.networkElementsService.createCable(data);
    }
    updatePole(id, data) {
        return this.networkElementsService.updatePole(id, data);
    }
    updateBox(id, data) {
        return this.networkElementsService.updateBox(id, data);
    }
    updateCable(id, data) {
        return this.networkElementsService.updateCable(id, data);
    }
    deletePole(id) {
        return this.networkElementsService.deletePole(id);
    }
    deleteBox(id) {
        return this.networkElementsService.deleteBox(id);
    }
    deleteCable(id) {
        return this.networkElementsService.deleteCable(id);
    }
    restorePole(id) {
        return this.networkElementsService.restorePole(id);
    }
    restoreBox(id) {
        return this.networkElementsService.restoreBox(id);
    }
    restoreCable(id) {
        return this.networkElementsService.restoreCable(id);
    }
    restoreOnu(id) {
        return this.networkElementsService.restoreOnu(id);
    }
    restoreRbs(id, req) {
        return this.networkElementsService.restoreRbs(id, req.user);
    }
    getBoxInternals(boxId) {
        console.log(`[NetworkElementsController] getBoxInternals header hit for ${boxId}`);
        return this.networkElementsService.getBoxInternals(boxId);
    }
    createSplitter(data) {
        return this.networkElementsService.createSplitter(data);
    }
    async splitCable(body) {
        return this.networkElementsService.splitCable(body.cableId, body.lat, body.lng);
    }
    async autoAssociatePoles(cableId) {
        return this.networkElementsService.autoAssociatePoles(cableId);
    }
    licensePoles(id) {
        return this.networkElementsService.licensePoles(id);
    }
    convertPointsToPoles(id) {
        return this.networkElementsService.convertPointsToPoles(id);
    }
    convertPolesToPoints(id) {
        return this.networkElementsService.convertPolesToPoints(id);
    }
    calculateElevationDistance(id) {
        return this.networkElementsService.calculateElevationDistance(id);
    }
    createFusion(data) {
        return this.networkElementsService.createFusion(data);
    }
    deleteFusion(id) {
        return this.networkElementsService.deleteFusion(id);
    }
    deleteSplitter(id) {
        return this.networkElementsService.deleteSplitter(id);
    }
    addBoxImage(id, imageUrl) {
        return this.networkElementsService.addBoxImage(id, imageUrl);
    }
    createCtoCustomer(data) {
        return this.networkElementsService.createCtoCustomer(data);
    }
    updateCtoCustomer(id, data) {
        return this.networkElementsService.createCtoCustomer({ ...data, id });
    }
    deleteCtoCustomer(id) {
        return this.networkElementsService.deleteCtoCustomer(id);
    }
    getCtoCustomersByBox(id) {
        return this.networkElementsService.findCtoCustomersByBox(id);
    }
    createOlt(data, req) {
        return this.networkElementsService.createOlt(data, req.user);
    }
    createRbs(data, req) {
        return this.networkElementsService.createRbs(data, req.user);
    }
    testRbsConnection(data) {
        return this.networkElementsService.testRbsConnection(data);
    }
    disconnectRbs(id, req) {
        return this.networkElementsService.disconnectRbs(id, req.user.tenantId);
    }
    getOlts(projectId, req) {
        return this.networkElementsService.getOlts(projectId, req.user.tenantId);
    }
    getAllOlts(req) {
        return this.networkElementsService.getAllOlts(req.user.tenantId);
    }
    getOltById(id, req) {
        return this.networkElementsService.getOltById(id, req.user.tenantId);
    }
    getRbs(projectId, req) {
        return this.networkElementsService.getRbs(projectId, req.user.tenantId);
    }
    getAllRbs(req) {
        return this.networkElementsService.getAllRbs(req.user.tenantId);
    }
    getMonitoringData(req) {
        return this.networkElementsService.getMonitoringData(req.user.tenantId);
    }
    deleteOlt(id, req) {
        return this.networkElementsService.deleteOlt(id, req.user);
    }
    updateOlt(id, data, req) {
        return this.networkElementsService.updateOlt(id, data, req.user);
    }
    deleteRbs(id, req) {
        return this.networkElementsService.deleteRbs(id, req.user);
    }
    updateRbs(id, data, req) {
        return this.networkElementsService.updateRbs(id, data, req.user);
    }
    getRbsMonitoring(id, req) {
        return this.networkElementsService.getRbsMonitoring(id, req.user.tenantId);
    }
    syncOnus(id, req) {
        return this.networkElementsService.syncOnus(id, req.user.tenantId);
    }
    getOnus(id, req) {
        return this.networkElementsService.getOnus(id, req.user.tenantId);
    }
    getOnusLive(id, req) {
        return this.networkElementsService.getOnusLive(id, req.user.tenantId);
    }
    getAllOnus(req) {
        return this.networkElementsService.getAllOnus(req.user.tenantId);
    }
    deleteOnu(id, req) {
        return this.networkElementsService.deleteOnu(id, req.user.tenantId);
    }
    pollDevice(type, id) {
        return this.networkElementsService.pollDeviceStatus(id, type);
    }
    tracePath(elementId, fiberIndex, req) {
        return this.networkElementsService.tracePath(elementId, parseInt(fiberIndex), req.user.tenantId);
    }
    getProjectDifferential(projectId, req) {
        return this.networkElementsService.getProjectDifferential(projectId, req.user.tenantId);
    }
    getExpansionSuggestions(projectId) {
        return this.networkElementsService.getExpansionSuggestions(projectId);
    }
    getNetworkHeatmap(projectId) {
        return this.networkElementsService.getExpansionSuggestions(projectId);
    }
    getLinkBudget(elementId, fiberIndex, req) {
        return this.networkElementsService.calculateLinkBudget(elementId, parseInt(fiberIndex), req.user.tenantId);
    }
    getTechnicalMemorial(projectId, req) {
        return this.networkElementsService.getTechnicalMemorial(projectId, req.user);
    }
    removeAllByProject(projectId, req) {
        console.log(`Request to delete all elements for project: ${projectId}`);
        return this.networkElementsService.removeAllByProject(projectId, req.user.tenantId);
    }
    getAlarms(req) {
        return this.networkElementsService.getAlarms(req.user.tenantId);
    }
    getAuditLogs(req) {
        return this.networkElementsService.getAuditLogs(req.user.tenantId);
    }
    getAnalytics(req) {
        return this.networkElementsService.getNetworkAnalytics(req.user.tenantId);
    }
    acknowledgeAlarm(id, req) {
        return this.networkElementsService.acknowledgeAlarm(id, req.user.userId, req.user.username, req.user.tenantId);
    }
    getWorkOrders(req) {
        return this.networkElementsService.getWorkOrders(req.user.tenantId);
    }
    createWorkOrder(data, req) {
        return this.networkElementsService.createWorkOrder(data, req.user);
    }
    updateWorkOrder(id, data, req) {
        return this.networkElementsService.updateWorkOrder(id, data, req.user.tenantId);
    }
    deleteWorkOrder(id, req) {
        return this.networkElementsService.deleteWorkOrder(id, req.user.tenantId);
    }
    rebootOnu(id, req) {
        return this.networkElementsService.rebootOnu(id, req.user.tenantId);
    }
    bulkReboot(ids, req) {
        return this.networkElementsService.bulkRebootOnus(ids, req.user.tenantId);
    }
    bulkAuthorize(ids, req) {
        return this.networkElementsService.bulkAuthorizeOnus(ids, req.user.tenantId);
    }
    updateOnu(id, data, req) {
        return this.networkElementsService.updateOnu(id, data, req.user.tenantId);
    }
    testOltCliConnection(data, req) {
        return this.networkElementsService.testOltCliConnection(data);
    }
    runOltDiscovery(id, req) {
        return this.networkElementsService.runOltDiscovery(id, req.user.tenantId);
    }
    getOltDiscovery(id, req) {
        return this.networkElementsService.getOltDiscovery(id, req.user.tenantId);
    }
    getOltPonPorts(id, req) {
        return this.networkElementsService.getOltPonPorts(id, req.user.tenantId);
    }
    applyOltTemplate(id, template, req) {
        return this.networkElementsService.applyOltTemplate(id, template, req.user);
    }
    createManualPonPort(id, data, req) {
        return this.networkElementsService.createManualPonPort(id, data, req.user);
    }
    deletePonPort(id, req) {
        return this.networkElementsService.deletePonPort(id, req.user);
    }
};
exports.NetworkElementsController = NetworkElementsController;
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "findAllByProject", null);
__decorate([
    (0, common_1.Post)('poles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createPole", null);
__decorate([
    (0, common_1.Post)('boxes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createBox", null);
__decorate([
    (0, common_1.Get)('boxes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "findOneBox", null);
__decorate([
    (0, common_1.Post)('cables'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createCable", null);
__decorate([
    (0, common_1.Patch)('poles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updatePole", null);
__decorate([
    (0, common_1.Patch)('boxes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateBox", null);
__decorate([
    (0, common_1.Patch)('cables/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateCable", null);
__decorate([
    (0, common_1.Delete)('poles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deletePole", null);
__decorate([
    (0, common_1.Delete)('boxes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteBox", null);
__decorate([
    (0, common_1.Delete)('cables/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteCable", null);
__decorate([
    (0, common_1.Patch)('poles/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "restorePole", null);
__decorate([
    (0, common_1.Patch)('boxes/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "restoreBox", null);
__decorate([
    (0, common_1.Patch)('cables/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "restoreCable", null);
__decorate([
    (0, common_1.Patch)('onus/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "restoreOnu", null);
__decorate([
    (0, common_1.Patch)('rbs/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "restoreRbs", null);
__decorate([
    (0, common_1.Get)('box/:boxId/internals'),
    __param(0, (0, common_1.Param)('boxId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getBoxInternals", null);
__decorate([
    (0, common_1.Post)('splitters'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createSplitter", null);
__decorate([
    (0, common_1.Post)('cables/split'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NetworkElementsController.prototype, "splitCable", null);
__decorate([
    (0, common_1.Post)('cables/auto-poles'),
    __param(0, (0, common_1.Body)('cableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkElementsController.prototype, "autoAssociatePoles", null);
__decorate([
    (0, common_1.Post)('cables/:id/license-poles'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "licensePoles", null);
__decorate([
    (0, common_1.Post)('cables/:id/convert-points-to-poles'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "convertPointsToPoles", null);
__decorate([
    (0, common_1.Post)('cables/:id/convert-poles-to-points'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "convertPolesToPoints", null);
__decorate([
    (0, common_1.Post)('cables/:id/calculate-elevation-distance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "calculateElevationDistance", null);
__decorate([
    (0, common_1.Post)('fusions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createFusion", null);
__decorate([
    (0, common_1.Delete)('fusions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteFusion", null);
__decorate([
    (0, common_1.Delete)('splitters/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteSplitter", null);
__decorate([
    (0, common_1.Post)('boxes/:id/images'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('imageUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "addBoxImage", null);
__decorate([
    (0, common_1.Post)('cto-customers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createCtoCustomer", null);
__decorate([
    (0, common_1.Patch)('cto-customers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateCtoCustomer", null);
__decorate([
    (0, common_1.Delete)('cto-customers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteCtoCustomer", null);
__decorate([
    (0, common_1.Get)('boxes/:id/cto-customers'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getCtoCustomersByBox", null);
__decorate([
    (0, common_1.Post)('olts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createOlt", null);
__decorate([
    (0, common_1.Post)('rbs'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createRbs", null);
__decorate([
    (0, common_1.Post)('test-rbs-connection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "testRbsConnection", null);
__decorate([
    (0, common_1.Post)('rbs/:id/disconnect'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "disconnectRbs", null);
__decorate([
    (0, common_1.Get)('project/:projectId/olts'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOlts", null);
__decorate([
    (0, common_1.Get)('olts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAllOlts", null);
__decorate([
    (0, common_1.Get)('olts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOltById", null);
__decorate([
    (0, common_1.Get)('project/:projectId/rbs'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getRbs", null);
__decorate([
    (0, common_1.Get)('rbs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAllRbs", null);
__decorate([
    (0, common_1.Get)('monitoring-data'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getMonitoringData", null);
__decorate([
    (0, common_1.Delete)('olts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteOlt", null);
__decorate([
    (0, common_1.Patch)('olts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateOlt", null);
__decorate([
    (0, common_1.Delete)('rbs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteRbs", null);
__decorate([
    (0, common_1.Patch)('rbs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateRbs", null);
__decorate([
    (0, common_1.Get)('rbs/:id/monitoring'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getRbsMonitoring", null);
__decorate([
    (0, common_1.Post)('olts/:id/sync-onus'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "syncOnus", null);
__decorate([
    (0, common_1.Get)('olts/:id/onus'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOnus", null);
__decorate([
    (0, common_1.Get)('olts/:id/onus-live'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOnusLive", null);
__decorate([
    (0, common_1.Get)('onus'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAllOnus", null);
__decorate([
    (0, common_1.Delete)('onus/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteOnu", null);
__decorate([
    (0, common_1.Post)('poll/:type/:id'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "pollDevice", null);
__decorate([
    (0, common_1.Get)('trace-path'),
    __param(0, (0, common_1.Query)('elementId')),
    __param(1, (0, common_1.Query)('fiberIndex')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "tracePath", null);
__decorate([
    (0, common_1.Get)('project/:projectId/differential'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getProjectDifferential", null);
__decorate([
    (0, common_1.Get)('project/:projectId/expansion-suggestions'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getExpansionSuggestions", null);
__decorate([
    (0, common_1.Get)('project/:projectId/heatmap'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getNetworkHeatmap", null);
__decorate([
    (0, common_1.Get)('link-budget'),
    __param(0, (0, common_1.Query)('elementId')),
    __param(1, (0, common_1.Query)('fiberIndex')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getLinkBudget", null);
__decorate([
    (0, common_1.Get)('project/:projectId/technical-memorial'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getTechnicalMemorial", null);
__decorate([
    (0, common_1.Delete)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "removeAllByProject", null);
__decorate([
    (0, common_1.Get)('alarms'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAlarms", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Patch)('alarms/:id/acknowledge'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "acknowledgeAlarm", null);
__decorate([
    (0, common_1.Get)('work-orders'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getWorkOrders", null);
__decorate([
    (0, common_1.Post)('work-orders'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createWorkOrder", null);
__decorate([
    (0, common_1.Patch)('work-orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateWorkOrder", null);
__decorate([
    (0, common_1.Delete)('work-orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deleteWorkOrder", null);
__decorate([
    (0, common_1.Post)('onus/:id/reboot'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "rebootOnu", null);
__decorate([
    (0, common_1.Post)('onus/bulk/reboot'),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "bulkReboot", null);
__decorate([
    (0, common_1.Post)('onus/bulk/authorize'),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "bulkAuthorize", null);
__decorate([
    (0, common_1.Patch)('onus/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "updateOnu", null);
__decorate([
    (0, common_1.Post)('test-cli-connection'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "testOltCliConnection", null);
__decorate([
    (0, common_1.Post)('olts/:id/discovery/run'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "runOltDiscovery", null);
__decorate([
    (0, common_1.Get)('olts/:id/discovery'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOltDiscovery", null);
__decorate([
    (0, common_1.Get)('olts/:id/pons'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "getOltPonPorts", null);
__decorate([
    (0, common_1.Post)('olts/:id/apply-template'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('template')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "applyOltTemplate", null);
__decorate([
    (0, common_1.Post)('olts/:id/pons/manual'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "createManualPonPort", null);
__decorate([
    (0, common_1.Delete)('pons/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetworkElementsController.prototype, "deletePonPort", null);
exports.NetworkElementsController = NetworkElementsController = __decorate([
    (0, common_1.Controller)('network-elements'),
    __metadata("design:paramtypes", [network_elements_service_1.NetworkElementsService])
], NetworkElementsController);
//# sourceMappingURL=network-elements.controller.js.map