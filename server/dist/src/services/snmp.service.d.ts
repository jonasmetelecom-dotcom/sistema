export declare class SnmpService {
    private readonly logger;
    private readonly debugLogPath;
    private logToDebug;
    private readonly OIDS;
    getDeviceStatus(ip: string, community: string): Promise<{
        uptime: string;
        name: string;
        description: string;
        online: boolean;
        icmpOnly?: boolean;
    }>;
    getRbsHealth(ip: string, community: string): Promise<{
        cpuLoad: number;
        freeMemory: number;
        totalMemory: number;
        voltage: number;
        temperature: number;
    }>;
    getRbsInterfaces(ip: string, community: string): Promise<Array<{
        index: number;
        name: string;
        status: 'up' | 'down';
        inOctets: number;
        outOctets: number;
    }>>;
    private formatUptime;
    private getMockDeviceStatus;
    private getMockRbsHealth;
    private getMockRbsInterfaces;
    rebootOnu(ip: string, community: string, port: string, serial: string): Promise<void>;
    setOnuName(ip: string, community: string, port: string, serial: string, name: string): Promise<void>;
    authorizeOnu(ip: string, community: string, port: string, serial: string): Promise<void>;
    getOltOnus(ip: string, community: string): Promise<any[]>;
    getOnuOpticalInfo(ip: string, community: string): Promise<Map<string, number>>;
    private discoverPonInterfacesViaIfMib;
    private detectOltVendor;
    private getVendorOids;
    private walkOnuData;
    private snmpWalk;
    private parseSerialNumber;
    private parsePonPort;
    private getMockOnus;
}
