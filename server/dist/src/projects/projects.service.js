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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./entities/project.entity");
const tenant_entity_1 = require("../tenants/entities/tenant.entity");
let ProjectsService = class ProjectsService {
    projectsRepository;
    tenantsRepository;
    constructor(projectsRepository, tenantsRepository) {
        this.projectsRepository = projectsRepository;
        this.tenantsRepository = tenantsRepository;
    }
    async create(createProjectDto, user) {
        const project = this.projectsRepository.create({
            ...createProjectDto,
            tenantId: user.tenantId,
        });
        return this.projectsRepository.save(project);
    }
    findAll(user) {
        return this.projectsRepository.find({ where: { tenantId: user.tenantId } });
    }
    findOne(id, user) {
        return this.projectsRepository.findOne({
            where: { id, tenantId: user.tenantId },
        });
    }
    update(id, updateProjectDto, user) {
        return this.projectsRepository.update({ id, tenantId: user.tenantId }, updateProjectDto);
    }
    remove(id, user) {
        return this.projectsRepository.delete({ id, tenantId: user.tenantId });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map