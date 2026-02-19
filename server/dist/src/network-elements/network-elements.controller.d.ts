import { NetworkElementsService } from './network-elements.service';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
import { CtoCustomer } from './entities/cto-customer.entity';
export declare class NetworkElementsController {
    private readonly networkElementsService;
    constructor(networkElementsService: NetworkElementsService);
    findAllByProject(projectId: string, req: any): Promise<{
        poles: Pole[];
        boxes: InfrastructureBox[];
        cables: Cable[];
        splitters: import("./entities/splitter.entity").Splitter[];
        fusions: import("./entities/fusion.entity").Fusion[];
        onus: import("./entities/onu.entity").Onu[];
        ctoCustomers: CtoCustomer[];
    }>;
    createPole(data: Partial<Pole>): Promise<Pole>;
    createBox(data: Partial<InfrastructureBox>): Promise<InfrastructureBox>;
    findOneBox(id: string): Promise<InfrastructureBox | null>;
    createCable(data: Partial<Cable>): Promise<Cable>;
    updatePole(id: string, data: Partial<Pole>): Promise<Pole | null>;
    updateBox(id: string, data: Partial<InfrastructureBox>): Promise<InfrastructureBox | null>;
    updateCable(id: string, data: Partial<Cable>): Promise<Cable | null>;
    deletePole(id: string): Promise<import("typeorm").UpdateResult>;
    deleteBox(id: string): Promise<import("typeorm").UpdateResult | import("typeorm").DeleteResult>;
    deleteCable(id: string): Promise<import("typeorm").UpdateResult>;
    restorePole(id: string): Promise<import("typeorm").UpdateResult>;
    restoreBox(id: string): Promise<import("typeorm").UpdateResult>;
    restoreCable(id: string): Promise<import("typeorm").UpdateResult>;
    getBoxInternals(boxId: string): Promise<{
        splitters: import("./entities/splitter.entity").Splitter[];
        fusions: import("./entities/fusion.entity").Fusion[];
        incomingCables: Cable[];
        outgoingCables: Cable[];
        destinationTypes: Record<string, string>;
        ctoCustomers: CtoCustomer[];
        images: string[];
        poleId: string | null;
    }>;
    createSplitter(data: any): Promise<import("./entities/splitter.entity").Splitter>;
    createFusion(data: any): Promise<import("./entities/fusion.entity").Fusion>;
    deleteFusion(id: string): Promise<import("typeorm").UpdateResult>;
    deleteSplitter(id: string): Promise<import("typeorm").UpdateResult>;
    addBoxImage(id: string, imageUrl: string): Promise<InfrastructureBox>;
    createCtoCustomer(data: Partial<CtoCustomer>): Promise<CtoCustomer>;
    updateCtoCustomer(id: string, data: Partial<CtoCustomer>): Promise<CtoCustomer | null>;
    deleteCtoCustomer(id: string): Promise<import("typeorm").DeleteResult>;
    getCtoCustomersByBox(id: string): Promise<CtoCustomer[]>;
    createOlt(data: any, req: any): Promise<import("./entities/olt.entity").Olt>;
    createRbs(data: any, req: any): Promise<import("./entities/rbs.entity").Rbs>;
    testRbsConnection(data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    disconnectRbs(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getOlts(projectId: string, req: any): Promise<import("./entities/olt.entity").Olt[]>;
    getAllOlts(req: any): Promise<import("./entities/olt.entity").Olt[]>;
    getOltById(id: string, req: any): Promise<import("./entities/olt.entity").Olt>;
    getRbs(projectId: string, req: any): Promise<import("./entities/rbs.entity").Rbs[]>;
    getAllRbs(req: any): Promise<import("./entities/rbs.entity").Rbs[]>;
    getMonitoringData(req: any): Promise<({
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
        onus: import("./entities/onu.entity").Onu[];
        ponPorts: import("./entities/pon-port.entity").PonPort[];
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
        createdAt: Date;
        tenantId: string;
    })[]>;
    deleteOlt(id: string, req: any): Promise<import("./entities/olt.entity").Olt>;
    updateOlt(id: string, data: any, req: any): Promise<import("./entities/olt.entity").Olt>;
    deleteRbs(id: string, req: any): Promise<import("./entities/rbs.entity").Rbs>;
    updateRbs(id: string, data: any, req: any): Promise<import("./entities/rbs.entity").Rbs>;
    getRbsMonitoring(id: string, req: any): Promise<{
        health: any;
        interfaces: any[];
        ports: any[];
        alarms: import("./entities/alarm.entity").Alarm[];
        monitoringMethod: "api" | "snmp" | "ping";
    }>;
    syncOnus(id: string, req: any): Promise<{
        success: boolean;
        count: number;
        cleanedCount: number;
    }>;
    getOnus(id: string, req: any): Promise<import("./entities/onu.entity").Onu[]>;
    getOnusLive(id: string, req: any): Promise<any[]>;
    getAllOnus(req: any): Promise<import("./entities/onu.entity").Onu[]>;
    deleteOnu(id: string, req: any): Promise<import("typeorm").DeleteResult>;
    pollDevice(type: 'olt' | 'rbs', id: string): Promise<{
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
        firmwareVersion: string;
        monitoringMethod: "snmp" | "cli" | "auto";
        status: string;
        lastSeen: Date;
        project: import("../projects/entities/project.entity").Project;
        projectId: string;
        onus: import("./entities/onu.entity").Onu[];
        ponPorts: import("./entities/pon-port.entity").PonPort[];
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
        onus: import("./entities/onu.entity").Onu[];
        ponPorts: import("./entities/pon-port.entity").PonPort[];
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
    tracePath(elementId: string, fiberIndex: string, req: any): Promise<{
        id: string;
        type: string;
        fiberIndex: number;
        side: "input" | "output" | "neutral";
    }[]>;
    getLinkBudget(elementId: string, fiberIndex: string, req: any): Promise<{
        totalLoss: number;
        totalDistance: number;
        estimatedSignal: number;
        status: "critical" | "optimal" | "warning";
        events: {
            type: string;
            description: string;
            loss: number;
        }[];
    }>;
    getTechnicalMemorial(projectId: string, req: any): Promise<{
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
    removeAllByProject(projectId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getAlarms(req: any): Promise<import("./entities/alarm.entity").Alarm[]>;
    getAuditLogs(req: any): Promise<import("./entities/audit-log.entity").AuditLog[]>;
    getAnalytics(req: any): Promise<{
        mttrHours: number;
        growthData: {
            month: any;
            count: any;
        }[];
        techStats: any[];
        totalWorkOrders: number;
    }>;
    acknowledgeAlarm(id: string, req: any): Promise<import("typeorm").UpdateResult>;
    getWorkOrders(req: any): Promise<import("./entities/work-order.entity").WorkOrder[]>;
    createWorkOrder(data: any, req: any): Promise<import("./entities/work-order.entity").WorkOrder>;
    updateWorkOrder(id: string, data: any, req: any): Promise<import("./entities/work-order.entity").WorkOrder | null>;
    deleteWorkOrder(id: string, req: any): Promise<import("typeorm").DeleteResult>;
    rebootOnu(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkReboot(ids: string[], req: any): Promise<{
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
    bulkAuthorize(ids: string[], req: any): Promise<{
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
    updateOnu(id: string, data: any, req: any): Promise<import("./entities/onu.entity").Onu | null>;
    testOltCliConnection(data: any, req: any): Promise<{
        success: boolean;
        message: string;
        output: string;
    } | {
        success: boolean;
        message: string;
        output?: undefined;
    }>;
    runOltDiscovery(id: string, req: any): Promise<import("../services/olt-discovery.service").DiscoveryResult>;
    getOltDiscovery(id: string, req: any): Promise<{
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
    getOltPonPorts(id: string, req: any): Promise<import("./entities/pon-port.entity").PonPort[]>;
    applyOltTemplate(id: string, template: string, req: any): Promise<{
        success: boolean;
        count: number;
    }>;
    createManualPonPort(id: string, data: any, req: any): Promise<import("./entities/pon-port.entity").PonPort[]>;
    deletePonPort(id: string, req: any): Promise<import("./entities/pon-port.entity").PonPort>;
}
