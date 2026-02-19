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
exports.Splitter = void 0;
const typeorm_1 = require("typeorm");
const box_entity_1 = require("./box.entity");
let Splitter = class Splitter {
    id;
    boxId;
    box;
    projectId;
    type;
    connectorType;
    structure;
    label;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Splitter = Splitter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Splitter.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Splitter.prototype, "boxId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => box_entity_1.InfrastructureBox),
    (0, typeorm_1.JoinColumn)({ name: 'boxId' }),
    __metadata("design:type", box_entity_1.InfrastructureBox)
], Splitter.prototype, "box", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Splitter.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '1:8' }),
    __metadata("design:type", String)
], Splitter.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'APC' }),
    __metadata("design:type", String)
], Splitter.prototype, "connectorType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'balanced' }),
    __metadata("design:type", String)
], Splitter.prototype, "structure", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Splitter.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Splitter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Splitter.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", Date)
], Splitter.prototype, "deletedAt", void 0);
exports.Splitter = Splitter = __decorate([
    (0, typeorm_1.Entity)('splitters')
], Splitter);
//# sourceMappingURL=splitter.entity.js.map