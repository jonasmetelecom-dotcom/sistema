import { Project } from '../../projects/entities/project.entity';
import { Onu } from './onu.entity';
import { PonPort } from './pon-port.entity';
export declare class Olt {
    id: string;
    name: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
    port: number;
    community: string;
    model: string;
    firmwareVersion: string;
    monitoringMethod: 'snmp' | 'cli' | 'auto';
    uptime: string;
    status: string;
    lastSeen: Date;
    project: Project;
    projectId: string;
    onus: Onu[];
    ponPorts: PonPort[];
    maintenanceUntil: Date;
    sysDescr: string;
    sysObjectID: string;
    capabilities: {
        pon_status_snmp: boolean;
        pon_traffic_snmp: boolean;
        uplink_power_snmp: boolean;
        onu_power_snmp: boolean;
        onu_power_cli: 'unknown' | 'true' | 'false';
    };
    discoveryResults: {
        lastRun: Date;
        status: 'success' | 'partial' | 'failed' | 'running';
        errors: string[];
    };
    cliProtocol: 'ssh' | 'telnet';
    cliUsername: string;
    cliPassword: string;
    createdAt: Date;
    tenantId: string;
}
