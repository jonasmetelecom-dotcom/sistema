export declare class Alarm {
    id: string;
    type: string;
    severity: string;
    deviceId: string;
    deviceName: string;
    message: string;
    isAcknowledged: boolean;
    acknowledgedBy: string;
    acknowledgedAt: Date;
    isResolved: boolean;
    resolvedAt: Date;
    createdAt: Date;
    tenantId: string;
    assignedTo: string;
    slaDeadline: Date;
}
