import { Tenant } from '../../tenants/entities/tenant.entity';
import { Olt } from '../../network-elements/entities/olt.entity';
import { Rbs } from '../../network-elements/entities/rbs.entity';
import { Pole } from '../../network-elements/entities/pole.entity';
import { InfrastructureBox } from '../../network-elements/entities/box.entity';
import { Cable } from '../../network-elements/entities/cable.entity';
import { Onu } from '../../network-elements/entities/onu.entity';
export declare class Project {
    id: string;
    name: string;
    description: string;
    city: string;
    latitude: number;
    longitude: number;
    tenant: Tenant;
    tenantId: string;
    olts: Olt[];
    rbs: Rbs[];
    poles: Pole[];
    boxes: InfrastructureBox[];
    cables: Cable[];
    onus: Onu[];
    status: string;
    settings: {
        prices?: {
            pole?: number;
            box?: Record<string, number>;
            cable?: Record<string, number>;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}
