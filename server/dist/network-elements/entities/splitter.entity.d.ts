import { InfrastructureBox } from './box.entity';
export declare class Splitter {
    id: string;
    boxId: string;
    box: InfrastructureBox;
    projectId: string;
    type: string;
    connectorType: string;
    structure: string;
    label: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
