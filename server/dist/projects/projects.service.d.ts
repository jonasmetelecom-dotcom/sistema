import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
export declare class ProjectsService {
    private projectsRepository;
    private tenantsRepository;
    constructor(projectsRepository: Repository<Project>, tenantsRepository: Repository<Tenant>);
    create(createProjectDto: CreateProjectDto, user: any): Promise<Project>;
    findAll(user: any): Promise<Project[]>;
    findOne(id: string, user: any): Promise<Project | null>;
    update(id: string, updateProjectDto: UpdateProjectDto, user: any): Promise<import("typeorm").UpdateResult>;
    remove(id: string, user: any): Promise<import("typeorm").DeleteResult>;
}
