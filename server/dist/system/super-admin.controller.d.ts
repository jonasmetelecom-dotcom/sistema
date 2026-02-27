import { TenantsService } from '../tenants/tenants.service';
import { AuthService } from '../auth/auth.service';
export declare class SuperAdminController {
    private readonly tenantsService;
    private readonly authService;
    constructor(tenantsService: TenantsService, authService: AuthService);
    findAll(): Promise<import("../tenants/entities/tenant.entity").Tenant[]>;
    approve(id: string): Promise<import("../tenants/entities/tenant.entity").Tenant>;
    updatePlan(id: string, body: {
        plan: string;
        expiresAt?: Date;
    }): Promise<import("../tenants/entities/tenant.entity").Tenant>;
    updateStatus(id: string, body: {
        isActive: boolean;
    }): Promise<import("../tenants/entities/tenant.entity").Tenant>;
    createManual(body: any): Promise<{
        message: string;
        tenantId: string;
    }>;
}
