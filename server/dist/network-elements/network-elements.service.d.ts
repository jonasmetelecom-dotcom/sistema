import { Repository } from 'typeorm';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
import { Splitter } from './entities/splitter.entity';
import { Fusion } from './entities/fusion.entity';
import { ProjectsService } from '../projects/projects.service';
import { Olt } from './entities/olt.entity';
import { Onu } from './entities/onu.entity';
import { Rbs } from './entities/rbs.entity';
import { Alarm } from './entities/alarm.entity';
import { AuditLog } from './entities/audit-log.entity';
import { WorkOrder } from './entities/work-order.entity';
import { CtoCustomer } from './entities/cto-customer.entity';
import { PonPort } from './entities/pon-port.entity';
import { SnmpService } from '../services/snmp.service';
import { OltDiscoveryService } from '../services/olt-discovery.service';
import { OltCliService } from '../services/olt-cli.service';
import { MikrotikApiService } from '../services/mikrotik-api.service';
import { MonitoringGateway } from '../gateways/monitoring.gateway';
import { PingService } from '../services/ping.service';
export declare class NetworkElementsService {
    private polesRepository;
    private boxesRepository;
    private cablesRepository;
    private splittersRepository;
    private fusionsRepository;
    private oltsRepository;
    private onusRepository;
    private ponPortsRepository;
    private rbsRepository;
    private alarmsRepository;
    private auditLogsRepository;
    private workOrdersRepository;
    private ctoCustomersRepository;
    private snmpService;
    private oltDiscoveryService;
    private oltCliService;
    private mikrotikApiService;
    private monitoringGateway;
    private pingService;
    private projectsService;
    private readonly logger;
    constructor(polesRepository: Repository<Pole>, boxesRepository: Repository<InfrastructureBox>, cablesRepository: Repository<Cable>, splittersRepository: Repository<Splitter>, fusionsRepository: Repository<Fusion>, oltsRepository: Repository<Olt>, onusRepository: Repository<Onu>, ponPortsRepository: Repository<PonPort>, rbsRepository: Repository<Rbs>, alarmsRepository: Repository<Alarm>, auditLogsRepository: Repository<AuditLog>, workOrdersRepository: Repository<WorkOrder>, ctoCustomersRepository: Repository<CtoCustomer>, snmpService: SnmpService, oltDiscoveryService: OltDiscoveryService, oltCliService: OltCliService, mikrotikApiService: MikrotikApiService, monitoringGateway: MonitoringGateway, pingService: PingService, projectsService: ProjectsService);
    findAllByProject(projectId: string, user: any): Promise<{
        poles: Pole[];
        boxes: InfrastructureBox[];
        cables: Cable[];
        splitters: Splitter[];
        fusions: Fusion[];
        onus: Onu[];
        ctoCustomers: CtoCustomer[];
    }>;
    createPole(data: Partial<Pole>): Promise<Pole>;
    createBox(data: Partial<InfrastructureBox>): Promise<InfrastructureBox>;
    findOneBox(id: string): Promise<InfrastructureBox | null>;
    createCable(data: Partial<Cable>): Promise<Cable>;
    createOnu(data: Partial<Onu>): Promise<Onu>;
    updatePole(id: string, data: Partial<Pole>): Promise<Pole | null>;
    updateBox(id: string, data: Partial<InfrastructureBox>): Promise<InfrastructureBox | null>;
    updateCable(id: string, data: Partial<Cable>): Promise<Cable | null>;
    deletePole(id: string): Promise<import("typeorm").UpdateResult>;
    restorePole(id: string): Promise<import("typeorm").UpdateResult>;
    restoreOnu(id: string): Promise<import("typeorm").UpdateResult>;
    restoreRbs(id: string, user?: any): Promise<import("typeorm").UpdateResult>;
    deleteBox(id: string): Promise<import("typeorm").UpdateResult | import("typeorm").DeleteResult>;
    restoreBox(id: string): Promise<import("typeorm").UpdateResult>;
    deleteCable(id: string): Promise<import("typeorm").UpdateResult>;
    restoreCable(id: string): Promise<import("typeorm").UpdateResult>;
    getBoxInternals(boxId: string): Promise<{
        splitters: Splitter[];
        fusions: Fusion[];
        incomingCables: Cable[];
        outgoingCables: Cable[];
        destinationTypes: Record<string, string>;
        ctoCustomers: CtoCustomer[];
        images: string[];
        poleId: string | null;
    }>;
    createSplitter(data: Partial<Splitter>): Promise<Splitter>;
    createCtoCustomer(data: Partial<CtoCustomer>): Promise<CtoCustomer>;
    createFusion(data: Partial<Fusion>): Promise<Fusion>;
    deleteFusion(id: string): Promise<import("typeorm").UpdateResult>;
    splitCable(cableId: string, lat: number, lng: number): Promise<{
        success: boolean;
        boxId: string;
    }>;
    autoAssociatePoles(cableId: string): Promise<string[] | undefined>;
    licensePoles(cableId: string): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    convertPointsToPoles(cableId: string): Promise<string[] | undefined>;
    convertPolesToPoints(cableId: string): Promise<{
        success: boolean;
    }>;
    calculateElevationDistance(cableId: string): Promise<{
        success: boolean;
        newLength: number;
    }>;
    deleteSplitter(id: string): Promise<import("typeorm").UpdateResult>;
    deleteCtoCustomer(id: string): Promise<import("typeorm").DeleteResult>;
    findCtoCustomersByBox(boxId: string): Promise<CtoCustomer[]>;
    createOlt(data: Partial<Olt>, user: any): Promise<Olt>;
    createRbs(data: Partial<Rbs>, user: any): Promise<Rbs>;
    testRbsConnection(data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    disconnectRbs(id: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getOlts(projectId: string, tenantId: string): Promise<Olt[]>;
    getAllOlts(tenantId?: string): Promise<Olt[]>;
    getOltById(id: string, tenantId: string): Promise<Olt>;
    getRbs(projectId: string, tenantId: string): Promise<Rbs[]>;
    getAllRbs(tenantId?: string): Promise<Rbs[]>;
    getMonitoringData(tenantId?: string): Promise<({
        type: string;
        isAlerting: boolean;
        isInMaintenance: boolean;
        id: string;
        name: string;
        ipAddress: string;
        latitude: number;
        longitude: number;
        port: number;
        community: string;
        model: string;
        firmwareVersion: string;
        monitoringMethod: "snmp" | "cli" | "auto";
        uptime: string;
        status: string;
        lastSeen: Date;
        project: import("../projects/entities/project.entity").Project;
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
            onu_power_cli: "unknown" | "true" | "false";
        };
        discoveryResults: {
            lastRun: Date;
            status: "success" | "partial" | "failed" | "running";
            errors: string[];
        };
        cliProtocol: "ssh" | "telnet";
        cliUsername: string;
        cliPassword: string;
        createdAt: Date;
        tenantId: string;
    } | {
        type: string;
        isAlerting: boolean;
        isInMaintenance: boolean;
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
        monitoringMethod: "api" | "snmp" | "ping";
        uptime: string;
        status: string;
        lastSeen: Date;
        cpuLoad: number;
        totalMemory: number;
        freeMemory: number;
        temperature: number;
        voltage: number;
        project: import("../projects/entities/project.entity").Project;
        projectId: string;
        maintenanceUntil: Date;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
    })[]>;
    deleteOlt(id: string, user: any): Promise<Olt>;
    updateOlt(id: string, data: Partial<Olt>, user: any): Promise<Olt>;
    deleteRbs(id: string, user: any): Promise<import("typeorm").UpdateResult>;
    updateRbs(id: string, data: Partial<Rbs>, user: any): Promise<Rbs>;
    getRbsMonitoring(id: string, tenantId: string): Promise<{
        health: any;
        interfaces: any[];
        ports: any[];
        alarms: Alarm[];
        monitoringMethod: "snmp" | "api" | "ping";
    }>;
    syncOnus(oltId: string, tenantId: string): Promise<{
        success: boolean;
        count: number;
        cleanedCount: number;
    }>;
    getAllOnus(tenantId: string): Promise<Onu[]>;
    getOnus(oltId: string, tenantId: string): Promise<Onu[]>;
    getOnusLive(oltId: string, tenantId: string): Promise<any[]>;
    deleteOnu(id: string, tenantId: string): Promise<import("typeorm").UpdateResult>;
    pollDeviceStatus(id: string, type: 'olt' | 'rbs'): Promise<{
        cpuLoad: number;
        freeMemory: number;
        totalMemory: number;
        voltage: number;
        temperature: number;
        uptime: string;
        name: string;
        description: string;
        online: boolean;
        icmpOnly?: boolean;
        id: string;
        ipAddress: string;
        latitude: number;
        longitude: number;
        port: number;
        community: string;
        model: string;
        firmwareVersion: string;
        monitoringMethod: "snmp" | "cli" | "auto";
        status: string;
        lastSeen: Date;
        project: import("../projects/entities/project.entity").Project;
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
            onu_power_cli: "unknown" | "true" | "false";
        };
        discoveryResults: {
            lastRun: Date;
            status: "success" | "partial" | "failed" | "running";
            errors: string[];
        };
        cliProtocol: "ssh" | "telnet";
        cliUsername: string;
        cliPassword: string;
        createdAt: Date;
        tenantId: string;
    } | {
        cpuLoad: number;
        freeMemory: number;
        totalMemory: number;
        voltage: number;
        temperature: number;
        uptime: string;
        name: string;
        description: string;
        online: boolean;
        icmpOnly?: boolean;
        id: string;
        ipAddress: string;
        latitude: number;
        longitude: number;
        port: number;
        community: string;
        model: string;
        apiUsername: string;
        apiPassword: string;
        apiPort: number;
        monitoringMethod: "api" | "snmp" | "ping";
        status: string;
        lastSeen: Date;
        project: import("../projects/entities/project.entity").Project;
        projectId: string;
        maintenanceUntil: Date;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
    } | {
        uptime: string;
        name: string;
        description: string;
        online: boolean;
        icmpOnly?: boolean;
        id: string;
        ipAddress: string;
        latitude: number;
        longitude: number;
        port: number;
        community: string;
        model: string;
        firmwareVersion: string;
        monitoringMethod: "snmp" | "cli" | "auto";
        status: string;
        lastSeen: Date;
        project: import("../projects/entities/project.entity").Project;
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
            onu_power_cli: "unknown" | "true" | "false";
        };
        discoveryResults: {
            lastRun: Date;
            status: "success" | "partial" | "failed" | "running";
            errors: string[];
        };
        cliProtocol: "ssh" | "telnet";
        cliUsername: string;
        cliPassword: string;
        createdAt: Date;
        tenantId: string;
    }>;
    getAlarms(tenantId?: string): Promise<Alarm[]>;
    acknowledgeAlarm(id: string, userId: string, userName: string, tenantId: string): Promise<import("typeorm").UpdateResult>;
    generateAlarm(data: {
        type: string;
        severity: string;
        deviceId: string;
        deviceName: string;
        message: string;
        tenantId?: string;
    }): Promise<Alarm>;
    logAudit(data: {
        userId: string;
        userName: string;
        action: string;
        entityType: string;
        entityId: string;
        details?: string;
        ipAddress?: string;
        tenantId?: string;
    }): Promise<AuditLog>;
    tracePath(startElementId: string, startFiberIndex: number, tenantId: string): Promise<{
        id: string;
        type: string;
        fiberIndex: number;
        side: "input" | "output" | "neutral";
    }[]>;
    private findFailoverConnectionsEnhanced;
    private findSplitterConnections;
    removeAllByProject(projectId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateLinkBudget(cableId: string, fiberIndex: number, tenantId: string): Promise<{
        totalLoss: number;
        totalDistance: number;
        estimatedSignal: number;
        status: "critical" | "optimal" | "warning";
        isAsBuilt: boolean;
        events: ({
            type: string;
            description: string;
            loss: number;
            status: string;
        } | {
            type: string;
            description: string;
            loss: any;
            status?: undefined;
        })[];
    }>;
    private calculateCableLength;
    getTechnicalMemorial(projectId: string, user: any): Promise<{
        projectName: string;
        customer: string;
        status: string;
        date: Date;
        summary: {
            totalPoles: number;
            totalBoxes: number;
            totalCablesMeters: number;
            totalSplitters: number;
            totalCustomers: number;
        };
        details: {
            boxes: Record<string, number>;
            cables: Record<string, number>;
        };
        bom: {
            items: any[];
            grandTotal: number;
        };
    }>;
    getProjectDifferential(projectId: string, tenantId: string): Promise<{
        projectId: string;
        projectName: string;
        stats: {
            poles: {
                total: number;
                built: number;
                projetado: number;
            };
            boxes: {
                total: number;
                built: number;
                projetado: number;
            };
            cables: {
                totalMeters: number;
                builtMeters: number;
                projetadoMeters: number;
            };
        };
        executionPercentage: number;
        summary: string;
    }>;
    addBoxImage(boxId: string, imageUrl: string): Promise<InfrastructureBox>;
    getAuditLogs(tenantId: string): Promise<AuditLog[]>;
    getNetworkAnalytics(tenantId: string): Promise<{
        mttrHours: number;
        growthData: {
            month: any;
            count: any;
        }[];
        techStats: any[];
        totalWorkOrders: number;
    }>;
    createWorkOrder(data: Partial<WorkOrder>, user: any): Promise<WorkOrder>;
    getWorkOrders(tenantId: string): Promise<WorkOrder[]>;
    updateWorkOrder(id: string, data: Partial<WorkOrder>, tenantId: string): Promise<WorkOrder | null>;
    deleteWorkOrder(id: string, tenantId: string): Promise<import("typeorm").DeleteResult>;
    rebootOnu(onuId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkRebootOnus(onuIds: string[], tenantId: string): Promise<{
        success: boolean;
        processed: number;
        results: ({
            id: string;
            success: boolean;
            error?: undefined;
        } | {
            id: string;
            success: boolean;
            error: any;
        })[];
    }>;
    authorizeOnu(onuId: string, tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkAuthorizeOnus(onuIds: string[], tenantId: string): Promise<{
        success: boolean;
        processed: number;
        results: ({
            id: string;
            success: boolean;
            error?: undefined;
        } | {
            id: string;
            success: boolean;
            error: any;
        })[];
    }>;
    updateOnu(id: string, data: Partial<Onu>, tenantId: string): Promise<Onu | null>;
    runOltDiscovery(oltId: string, tenantId: string): Promise<import("../services/olt-discovery.service").DiscoveryResult>;
    getOltDiscovery(oltId: string, tenantId: string): Promise<{
        capabilities: {
            pon_status_snmp: boolean;
            pon_traffic_snmp: boolean;
            uplink_power_snmp: boolean;
            onu_power_snmp: boolean;
            onu_power_cli: "unknown" | "true" | "false";
        };
        discoveryResults: {
            lastRun: Date;
            status: "success" | "partial" | "failed" | "running";
            errors: string[];
        };
        sysDescr: string;
        sysObjectID: string;
    }>;
    getOltPonPorts(oltId: string, tenantId: string): Promise<PonPort[]>;
    isOltDiscoveryActive(oltId: string): boolean;
    isOltIpDiscoveryActive(ip: string): boolean;
    testOltCliConnection(data: any): Promise<{
        success: boolean;
        message: string;
        output: string;
    } | {
        success: boolean;
        message: string;
        output?: undefined;
    }>;
    applyOltTemplate(oltId: string, templateType: string, user: any): Promise<{
        success: boolean;
        count: number;
    }>;
    createManualPonPort(oltId: string, data: any, user: any): Promise<PonPort[]>;
    deletePonPort(id: string, user: any): Promise<PonPort>;
    getExpansionSuggestions(projectId: string): Promise<{
        latitude: number;
        longitude: number;
        uncoveredCount: number;
        reason: string;
        type: string;
    }[]>;
    private calculateDistance;
}
