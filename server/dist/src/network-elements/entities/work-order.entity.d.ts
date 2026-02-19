export declare class WorkOrder {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignedTo: string;
    technicianName: string;
    dueDate: Date;
    tenantId: string;
    boxId: string;
    alarmId: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date;
}
