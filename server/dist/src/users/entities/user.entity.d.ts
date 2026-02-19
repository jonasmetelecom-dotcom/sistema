import { Tenant } from '../../tenants/entities/tenant.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    tenant: Tenant;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
