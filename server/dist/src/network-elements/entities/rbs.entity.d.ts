import { Project } from '../../projects/entities/project.entity';
export declare class Rbs {
    id: string;
    name: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
    port: number;
    community: string;
    model: string;
    apiUsername: string;
    apiPassword: string;
    apiPort: number;
    monitoringMethod: 'api' | 'snmp' | 'ping';
    uptime: string;
    status: string;
    lastSeen: Date;
    cpuLoad: number;
    totalMemory: number;
    freeMemory: number;
    temperature: number;
    voltage: number;
    project: Project;
    projectId: string;
    maintenanceUntil: Date;
    createdAt: Date;
    tenantId: string;
}
