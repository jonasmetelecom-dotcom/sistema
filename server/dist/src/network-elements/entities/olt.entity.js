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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Olt = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../projects/entities/project.entity");
const onu_entity_1 = require("./onu.entity");
const pon_port_entity_1 = require("./pon-port.entity");
let Olt = class Olt {
    id;
    name;
    ipAddress;
    latitude;
    longitude;
    port;
    community;
    model;
    firmwareVersion;
    monitoringMethod;
    uptime;
    status;
    lastSeen;
    project;
    projectId;
    onus;
    ponPorts;
    maintenanceUntil;
    sysDescr;
    sysObjectID;
    capabilities;
    discoveryResults;
    cliProtocol;
    cliUsername;
    cliPassword;
    createdAt;
    tenantId;
};
exports.Olt = Olt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Olt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Olt.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Olt.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Olt.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Olt.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 161 }),
    __metadata("design:type", Number)
], Olt.prototype, "port", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Olt.prototype, "community", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'auto' }),
    __metadata("design:type", String)
], Olt.prototype, "monitoringMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "uptime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'offline' }),
    __metadata("design:type", String)
], Olt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Olt.prototype, "lastSeen", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.olts, {
        onDelete: 'CASCADE',
        nullable: true,
    }),
    __metadata("design:type", project_entity_1.Project)
], Olt.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => onu_entity_1.Onu, (onu) => onu.olt),
    __metadata("design:type", Array)
], Olt.prototype, "onus", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pon_port_entity_1.PonPort, (ponPort) => ponPort.olt),
    __metadata("design:type", Array)
], Olt.prototype, "ponPorts", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Olt.prototype, "maintenanceUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "sysDescr", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "sysObjectID", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Olt.prototype, "capabilities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Olt.prototype, "discoveryResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'ssh' }),
    __metadata("design:type", String)
], Olt.prototype, "cliProtocol", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "cliUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, select: false }),
    __metadata("design:type", String)
], Olt.prototype, "cliPassword", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Olt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Olt.prototype, "tenantId", void 0);
exports.Olt = Olt = __decorate([
    (0, typeorm_1.Entity)()
], Olt);
//# sourceMappingURL=olt.entity.js.map