import { RouterOSClient } from 'mikro-routeros';
interface MikrotikConnection {
    host: string;
    username: string;
    password: string;
    port?: number;
    timeout?: number;
}
interface ResourceStats {
    cpuLoad: number;
    freeMemory: number;
    totalMemory: number;
    uptime: string;
    voltage?: number;
    temperature?: number;
}
interface InterfaceStats {
    index: number;
    name: string;
    status: 'up' | 'down';
    rxBytes: number;
    txBytes: number;
}
interface EthernetPort {
    name: string;
    running: boolean;
    speed: string;
    duplex: string;
    linkDowns: number;
}
interface PortTraffic {
    interface: string;
    rxBitsPerSecond: number;
    txBitsPerSecond: number;
    rxPacketsPerSecond: number;
    txPacketsPerSecond: number;
}
export declare class MikrotikApiService {
    private readonly logger;
    private connections;
    connect(config: MikrotikConnection): Promise<RouterOSClient>;
    getResourceStats(config: MikrotikConnection): Promise<ResourceStats>;
    getInterfaceStats(config: MikrotikConnection): Promise<InterfaceStats[]>;
    getInterfaceTraffic(config: MikrotikConnection): Promise<any[]>;
    getEthernetPorts(config: MikrotikConnection): Promise<EthernetPort[]>;
    monitorPortTraffic(config: MikrotikConnection, interfaceName: string): Promise<PortTraffic>;
    disconnect(host: string, port?: number): Promise<void>;
    disconnectAll(): Promise<void>;
}
export {};
