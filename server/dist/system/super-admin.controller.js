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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("../tenants/tenants.service");
const auth_service_1 = require("../auth/auth.service");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let SuperAdminController = class SuperAdminController {
    tenantsService;
    authService;
    constructor(tenantsService, authService) {
        this.tenantsService = tenantsService;
        this.authService = authService;
    }
    findAll() {
        return this.tenantsService.findAll();
    }
    async approve(id) {
        return this.tenantsService.update(id, {
            isActive: true,
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
    }
    async updatePlan(id, body) {
        const updateData = { plan: body.plan };
        if (body.expiresAt) {
            updateData.subscriptionEndsAt = body.expiresAt;
        }
        return this.tenantsService.update(id, updateData);
    }
    async updateStatus(id, body) {
        return this.tenantsService.update(id, { isActive: body.isActive });
    }
    async createManual(body) {
        return this.authService.registerManual(body);
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/plan'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('manual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createManual", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)('admin/tenants'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService,
        auth_service_1.AuthService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map