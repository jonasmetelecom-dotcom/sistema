import { InfrastructureBox } from './box.entity';
import { Project } from '../../projects/entities/project.entity';
export declare class CtoCustomer {
    id: string;
    boxId: string;
    box: InfrastructureBox;
    splitterId: string;
    portIndex: number;
    name: string;
    externalId: string;
    status: string;
    description: string;
    observation: string;
    projectId: string;
    project: Project;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
