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
exports.PonPort = void 0;
const typeorm_1 = require("typeorm");
const olt_entity_1 = require("./olt.entity");
let PonPort = class PonPort {
    id;
    oltId;
    ifIndex;
    ifDescr;
    ifOperStatus;
    ifInOctets;
    ifOutOctets;
    createdAt;
    lastUpdated;
    tenantId;
    olt;
};
exports.PonPort = PonPort;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PonPort.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PonPort.prototype, "oltId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PonPort.prototype, "ifIndex", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PonPort.prototype, "ifDescr", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PonPort.prototype, "ifOperStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PonPort.prototype, "ifInOctets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], PonPort.prototype, "ifOutOctets", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PonPort.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PonPort.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PonPort.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => olt_entity_1.Olt, (olt) => olt.ponPorts, { onDelete: 'CASCADE' }),
    __metadata("design:type", olt_entity_1.Olt)
], PonPort.prototype, "olt", void 0);
exports.PonPort = PonPort = __decorate([
    (0, typeorm_1.Entity)('pon_ports')
], PonPort);
//# sourceMappingURL=pon-port.entity.js.map