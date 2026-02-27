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
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const olt_entity_1 = require("./entities/olt.entity");
const rbs_entity_1 = require("./entities/rbs.entity");
const onu_entity_1 = require("./entities/onu.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const alarm_entity_1 = require("./entities/alarm.entity");
const pole_entity_1 = require("./entities/pole.entity");
const box_entity_1 = require("./entities/box.entity");
const cable_entity_1 = require("./entities/cable.entity");
let StatsController = class StatsController {
    oltsRepository;
    rbsRepository;
    onusRepository;
    projectsRepository;
    alarmsRepository;
    polesRepository;
    boxesRepository;
    cablesRepository;
    constructor(oltsRepository, rbsRepository, onusRepository, projectsRepository, alarmsRepository, polesRepository, boxesRepository, cablesRepository) {
        this.oltsRepository = oltsRepository;
        this.rbsRepository = rbsRepository;
        this.onusRepository = onusRepository;
        this.projectsRepository = projectsRepository;
        this.alarmsRepository = alarmsRepository;
        this.polesRepository = polesRepository;
        this.boxesRepository = boxesRepository;
        this.cablesRepository = cablesRepository;
    }
    async getDashboardStats(req) {
        const tenantId = req.user.tenantId;
        const [totalProjects, olts, rbs, totalOnus] = await Promise.all([
            this.projectsRepository.count({ where: { tenantId } }),
            this.oltsRepository.find({ where: { tenantId } }),
            this.rbsRepository.find({ where: { tenantId } }),
            this.onusRepository.count({ where: { tenantId } }),
        ]);
        const onlineOlts = olts.filter((o) => o.status === 'online').length;
        const onlineRbs = rbs.filter((r) => r.status === 'online').length;
        const totalEquipments = olts.length + rbs.length;
        const onlineEquipments = onlineOlts + onlineRbs;
        const networkHealth = totalEquipments > 0
            ? Math.round((onlineEquipments / totalEquipments) * 100)
            : 100;
        const totalCapacity = olts.length * 16 * 64;
        const occupationPercent = totalCapacity > 0 ? Math.round((totalOnus / totalCapacity) * 100) : 0;
        return {
            totalClients: totalOnus,
            networkHealth: `${networkHealth}%`,
            networkStatus: networkHealth > 90
                ? 'Operação Normal'
                : networkHealth > 50
                    ? 'Atenção'
                    : 'Crítico',
            activeProjects: totalProjects,
            occupation: {
                percent: occupationPercent,
                used: totalOnus,
                total: totalCapacity,
            },
            equipmentStats: {
                total: totalEquipments,
                online: onlineEquipments,
                offline: totalEquipments - onlineEquipments,
            },
        };
    }
    async getRecentAlarms(req) {
        const tenantId = req.user.tenantId;
        return this.alarmsRepository.find({
            where: { tenantId, isAcknowledged: false },
            order: { createdAt: 'DESC' },
            take: 5,
        });
    }
    async getProjectInventory(id, req) {
        const tenantId = req.user.tenantId;
        const [project, poles, boxes, cables, rbs] = await Promise.all([
            this.projectsRepository.findOne({ where: { id, tenantId } }),
            this.polesRepository.count({ where: { projectId: id } }),
            this.boxesRepository.find({ where: { projectId: id } }),
            this.cablesRepository.find({ where: { projectId: id } }),
            this.rbsRepository.count({ where: { projectId: id } }),
        ]);
        if (!project)
            return { message: 'Project not found' };
        const boxTypes = boxes.reduce((acc, b) => {
            acc[b.type] = (acc[b.type] || 0) + 1;
            return acc;
        }, {});
        const cableStats = cables.reduce((acc, c) => {
            let length = 0;
            if (c.points && Array.isArray(c.points)) {
                for (let i = 0; i < c.points.length - 1; i++) {
                    const p1 = c.points[i];
                    const p2 = c.points[i + 1];
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
            length += c.slack || 0;
            acc[c.type] = (acc[c.type] || 0) + length;
            return acc;
        }, {});
        return {
            poles: poles,
            boxes: boxTypes,
            cablesInMeters: cableStats,
            totalCablesMeters: Object.values(cableStats).reduce((a, b) => a + b, 0),
            rbs: rbs,
        };
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('recent-alarms'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getRecentAlarms", null);
__decorate([
    (0, common_1.Get)('project/:id/inventory'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getProjectInventory", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, typeorm_1.InjectRepository)(olt_entity_1.Olt)),
    __param(1, (0, typeorm_1.InjectRepository)(rbs_entity_1.Rbs)),
    __param(2, (0, typeorm_1.InjectRepository)(onu_entity_1.Onu)),
    __param(3, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(4, (0, typeorm_1.InjectRepository)(alarm_entity_1.Alarm)),
    __param(5, (0, typeorm_1.InjectRepository)(pole_entity_1.Pole)),
    __param(6, (0, typeorm_1.InjectRepository)(box_entity_1.InfrastructureBox)),
    __param(7, (0, typeorm_1.InjectRepository)(cable_entity_1.Cable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StatsController);
//# sourceMappingURL=stats.controller.js.map