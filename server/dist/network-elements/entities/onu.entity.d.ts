import { Olt } from './olt.entity';
import { Project } from '../../projects/entities/project.entity';
export declare class Onu {
    id: string;
    serialNumber: string;
    name: string;
    ponPort: string;
    latitude: number;
    longitude: number;
    signalLevel: number;
    status: string;
    isAuthorized: boolean;
    lastSeen: Date;
    project: Project;
    projectId: string;
    olt: Olt;
    oltId: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
