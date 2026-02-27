import { InfrastructureBox } from './box.entity';
import { Splitter } from './splitter.entity';
export declare class SplitterPort {
    id: string;
    boxId: string;
    box: InfrastructureBox;
    splitterId: string;
    splitter: Splitter;
    portIndex: number;
    status: string;
    customerName: string;
    customerId: string;
    description: string;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
