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
exports.Onu = void 0;
const typeorm_1 = require("typeorm");
const olt_entity_1 = require("./olt.entity");
const project_entity_1 = require("../../projects/entities/project.entity");
let Onu = class Onu {
    id;
    serialNumber;
    name;
    ponPort;
    latitude;
    longitude;
    signalLevel;
    status;
    isAuthorized;
    lastSeen;
    project;
    projectId;
    olt;
    oltId;
    tenantId;
    createdAt;
    updatedAt;
};
exports.Onu = Onu;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Onu.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "ponPort", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], Onu.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], Onu.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], Onu.prototype, "signalLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'offline' }),
    __metadata("design:type", String)
], Onu.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Onu.prototype, "isAuthorized", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Onu.prototype, "lastSeen", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.onus, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], Onu.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => olt_entity_1.Olt, (olt) => olt.onus, { onDelete: 'CASCADE', nullable: true }),
    __metadata("design:type", olt_entity_1.Olt)
], Onu.prototype, "olt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "oltId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Onu.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Onu.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Onu.prototype, "updatedAt", void 0);
exports.Onu = Onu = __decorate([
    (0, typeorm_1.Entity)()
], Onu);
//# sourceMappingURL=onu.entity.js.map