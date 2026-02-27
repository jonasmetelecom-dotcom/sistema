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
exports.SplitterPort = void 0;
const typeorm_1 = require("typeorm");
const box_entity_1 = require("./box.entity");
const splitter_entity_1 = require("./splitter.entity");
let SplitterPort = class SplitterPort {
    id;
    boxId;
    box;
    splitterId;
    splitter;
    portIndex;
    status;
    customerName;
    customerId;
    description;
    projectId;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.SplitterPort = SplitterPort;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SplitterPort.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SplitterPort.prototype, "boxId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => box_entity_1.InfrastructureBox),
    (0, typeorm_1.JoinColumn)({ name: 'boxId' }),
    __metadata("design:type", box_entity_1.InfrastructureBox)
], SplitterPort.prototype, "box", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SplitterPort.prototype, "splitterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => splitter_entity_1.Splitter),
    (0, typeorm_1.JoinColumn)({ name: 'splitterId' }),
    __metadata("design:type", splitter_entity_1.Splitter)
], SplitterPort.prototype, "splitter", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SplitterPort.prototype, "portIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'free' }),
    __metadata("design:type", String)
], SplitterPort.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SplitterPort.prototype, "customerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SplitterPort.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SplitterPort.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SplitterPort.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SplitterPort.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SplitterPort.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)(),
    __metadata("design:type", Date)
], SplitterPort.prototype, "deletedAt", void 0);
exports.SplitterPort = SplitterPort = __decorate([
    (0, typeorm_1.Entity)('splitter_ports')
], SplitterPort);
//# sourceMappingURL=splitter-port.entity.js.map