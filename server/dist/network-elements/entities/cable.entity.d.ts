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
    level: string;
    tags: string;
    colors: string;
    length3D: number;
    createdAt: Date;
    updatedAt: Date;
    slack: number;
    status: string;
    looses: number;
    observations: string;
    poleIds: string[];
    occupation: number;
    reserves: {
        poleId: string;
        length: number;
    }[];
    reserveLength: number;
    totalLength: number;
    isLocked: boolean;
    geojson: string;
    deletedAt: Date;
}
