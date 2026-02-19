import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(req: any, createProjectDto: CreateProjectDto): Promise<import("./entities/project.entity").Project>;
    findAll(req: any): Promise<import("./entities/project.entity").Project[]>;
    findOne(id: string, req: any): Promise<import("./entities/project.entity").Project | null>;
    update(id: string, updateProjectDto: UpdateProjectDto, req: any): Promise<import("typeorm").UpdateResult>;
    remove(id: string, req: any): Promise<import("typeorm").DeleteResult>;
}
