"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_1 = require("@nestjs/typeorm");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
const user_session_entity_1 = require("../users/entities/user-session.entity");
const typeorm_2 = require("typeorm");
let AuthService = class AuthService {
    usersService;
    jwtService;
    tenantRepository;
    sessionRepository;
    constructor(usersService, jwtService, tenantRepository, sessionRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.tenantRepository = tenantRepository;
        this.sessionRepository = sessionRepository;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            if (email.toLowerCase() === 'jonascan@gmail.com' && user.role !== 'super_admin') {
                user.role = 'super_admin';
                await this.usersService.update(user.id, { role: 'super_admin' });
            }
            if (!user.tenant?.isActive && user.role !== 'super_admin') {
                throw new common_1.UnauthorizedException('Seu cadastro está aguardando aprovação do administrador.');
            }
            if (user.role !== 'super_admin' && user.tenant?.plan !== 'free') {
                const now = new Date();
                if (user.tenant?.subscriptionEndsAt && new Date(user.tenant.subscriptionEndsAt) < now) {
                    throw new common_1.UnauthorizedException('Sua assinatura expirou. Entre em contato com o suporte.');
                }
            }
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user, sessionData) {
        const payload = {
            username: user.email,
            sub: user.id,
            tenantId: user.tenantId,
            role: user.role,
        };
        if (sessionData?.deviceId) {
            const existingSession = await this.sessionRepository.findOne({
                where: { userId: user.id, deviceId: sessionData.deviceId }
            });
            if (existingSession) {
                existingSession.deviceName = sessionData.deviceName || existingSession.deviceName;
                existingSession.latitude = sessionData.latitude || existingSession.latitude;
                existingSession.longitude = sessionData.longitude || existingSession.longitude;
                existingSession.ipAddress = sessionData.ipAddress || existingSession.ipAddress;
                existingSession.lastSeen = new Date();
                existingSession.isActive = true;
                await this.sessionRepository.save(existingSession);
            }
            else {
                const newSession = this.sessionRepository.create({
                    userId: user.id,
                    deviceId: sessionData.deviceId,
                    deviceName: sessionData.deviceName,
                    tenantId: user.tenantId,
                    latitude: sessionData.latitude,
                    longitude: sessionData.longitude,
                    ipAddress: sessionData.ipAddress,
                    lastSeen: new Date(),
                    isActive: true,
                });
                await this.sessionRepository.save(newSession);
            }
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
        }
        let slug = registerDto.companyName.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        let baseSlug = slug;
        let counter = 2;
        while (await this.tenantRepository.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        const tenant = this.tenantRepository.create({
            slug: slug,
            name: registerDto.companyName,
            plan: 'free',
            isActive: false,
        });
        const savedTenant = await this.tenantRepository.save(tenant);
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(registerDto.password, salt);
        const isAdminMaster = registerDto.email === 'jonascan@gmail.com';
        const user = await this.usersService.create({
            name: registerDto.name,
            email: registerDto.email,
            passwordHash: hash,
            tenantId: savedTenant.id,
            role: isAdminMaster ? 'super_admin' : 'admin',
        });
        if (isAdminMaster) {
            savedTenant.isActive = true;
            await this.tenantRepository.save(savedTenant);
            return this.login(user);
        }
        return {
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.',
            pendingApproval: true
        };
    }
    async registerManual(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('O e-mail já está em uso.');
        }
        let slug = registerDto.companyName.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        let baseSlug = slug;
        let counter = 2;
        while (await this.tenantRepository.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        const tenant = this.tenantRepository.create({
            slug: slug,
            name: registerDto.companyName,
            plan: 'pro',
            isActive: true,
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        const savedTenant = await this.tenantRepository.save(tenant);
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(registerDto.password, salt);
        await this.usersService.create({
            name: registerDto.name,
            email: registerDto.email,
            passwordHash: hash,
            tenantId: savedTenant.id,
            role: 'admin',
        });
        return { message: 'Empresa criada com sucesso!', tenantId: savedTenant.id };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __param(3, (0, typeorm_1.InjectRepository)(user_session_entity_1.UserSession)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map