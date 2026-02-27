import { Olt } from './olt.entity';
export declare class PonPort {
    id: string;
    oltId: string;
    ifIndex: number;
    ifDescr: string;
    ifOperStatus: number;
    ifInOctets: number;
    ifOutOctets: number;
    createdAt: Date;
    lastUpdated: Date;
    tenantId: string;
    olt: Olt;
}
