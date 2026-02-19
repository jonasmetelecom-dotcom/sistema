import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: any) {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      tenantId: user.tenantId,
    });
    return this.projectsRepository.save(project);
  }

  findAll(user: any) {
    return this.projectsRepository.find({ where: { tenantId: user.tenantId } });
  }

  findOne(id: string, user: any) {
    return this.projectsRepository.findOne({
      where: { id, tenantId: user.tenantId },
    });
  }

  update(id: string, updateProjectDto: UpdateProjectDto, user: any) {
    return this.projectsRepository.update(
      { id, tenantId: user.tenantId },
      updateProjectDto,
    );
  }

  remove(id: string, user: any) {
    return this.projectsRepository.delete({ id, tenantId: user.tenantId });
  }
}
