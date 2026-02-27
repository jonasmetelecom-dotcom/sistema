import { Project } from '../../projects/entities/project.entity';
export declare class Pole {
    id: string;
    name: string;
    material: string;
    height: number;
    latitude: number;
    longitude: number;
    project: Project;
    projectId: string;
    licensed: boolean;
    status: string;
    concessionaire: string;
    currentLoad: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
