import { Project } from '../../projects/entities/project.entity';
export declare class InfrastructureBox {
    id: string;
    name: string;
    type: string;
    capacity: number;
    latitude: number;
    longitude: number;
    images: string[];
    status: string;
    project: Project;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
