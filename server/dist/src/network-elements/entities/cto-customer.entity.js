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
exports.CtoCustomer = void 0;
const typeorm_1 = require("typeorm");
const box_entity_1 = require("./box.entity");
const project_entity_1 = require("../../projects/entities/project.entity");
let CtoCustomer = class CtoCustomer {
    id;
    boxId;
    box;
    splitterId;
    portIndex;
    name;
    observation;
    projectId;
    project;
    createdAt;
    updatedAt;
};
exports.CtoCustomer = CtoCustomer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CtoCustomer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CtoCustomer.prototype, "boxId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => box_entity_1.InfrastructureBox),
    (0, typeorm_1.JoinColumn)({ name: 'boxId' }),
    __metadata("design:type", box_entity_1.InfrastructureBox)
], CtoCustomer.prototype, "box", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CtoCustomer.prototype, "splitterId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CtoCustomer.prototype, "portIndex", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CtoCustomer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CtoCustomer.prototype, "observation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CtoCustomer.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", project_entity_1.Project)
], CtoCustomer.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CtoCustomer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CtoCustomer.prototype, "updatedAt", void 0);
exports.CtoCustomer = CtoCustomer = __decorate([
    (0, typeorm_1.Entity)('cto_customers')
], CtoCustomer);
//# sourceMappingURL=cto-customer.entity.js.map