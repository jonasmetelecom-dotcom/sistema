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
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../../tenants/entities/tenant.entity");
const olt_entity_1 = require("../../network-elements/entities/olt.entity");
const rbs_entity_1 = require("../../network-elements/entities/rbs.entity");
const pole_entity_1 = require("../../network-elements/entities/pole.entity");
const box_entity_1 = require("../../network-elements/entities/box.entity");
const cable_entity_1 = require("../../network-elements/entities/cable.entity");
const onu_entity_1 = require("../../network-elements/entities/onu.entity");
let Project = class Project {
    id;
    name;
    description;
    city;
    latitude;
    longitude;
    tenant;
    tenantId;
    olts;
    rbs;
    poles;
    boxes;
    cables;
    onus;
    status;
    settings;
    createdAt;
    updatedAt;
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Project.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Project.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Project.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'tenantId' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], Project.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Project.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => olt_entity_1.Olt, (olt) => olt.project),
    __metadata("design:type", Array)
], Project.prototype, "olts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rbs_entity_1.Rbs, (rbs) => rbs.project),
    __metadata("design:type", Array)
], Project.prototype, "rbs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pole_entity_1.Pole, (pole) => pole.project),
    __metadata("design:type", Array)
], Project.prototype, "poles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => box_entity_1.InfrastructureBox, (box) => box.project),
    __metadata("design:type", Array)
], Project.prototype, "boxes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cable_entity_1.Cable, (cable) => cable.project),
    __metadata("design:type", Array)
], Project.prototype, "cables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => onu_entity_1.Onu, (onu) => onu.project),
    __metadata("design:type", Array)
], Project.prototype, "onus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'draft' }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Project.prototype, "updatedAt", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects')
], Project);
//# sourceMappingURL=project.entity.js.map