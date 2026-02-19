import { Project } from '../../projects/entities/project.entity';
export declare class Cable {
    id: string;
    name: string;
    type: string;
    fiberCount: number;
    points: {
        lat: number;
        lng: number;
    }[];
    project: Project;
    projectId: string;
    fromId: string;
    fromType: string;
    toId: string;
    toType: string;
    createdAt: Date;
    updatedAt: Date;
    slack: number;
    deletedAt: Date;
}
