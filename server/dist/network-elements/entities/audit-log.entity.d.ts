export declare class AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    ipAddress: string;
    createdAt: Date;
    tenantId: string;
}
