import { Repository } from 'typeorm';
import { Olt } from '../network-elements/entities/olt.entity';
import { PonPort } from '../network-elements/entities/pon-port.entity';
import { Onu } from '../network-elements/entities/onu.entity';
import { OltCliService } from './olt-cli.service';
import { SnmpService } from './snmp.service';
export interface DiscoveryResult {
    success: boolean;
    sysDescr?: string;
    sysObjectID?: string;
    ponPorts?: PonPort[];
    discoveredOnus?: any[];
    capabilities?: {
        pon_status_snmp: boolean;
        pon_traffic_snmp: boolean;
        uplink_power_snmp: boolean;
        onu_power_snmp: boolean;
        onu_power_cli: 'unknown' | 'true' | 'false';
    };
    errors: string[];
}
export declare class OltDiscoveryService {
    private oltsRepository;
    private ponPortsRepository;
    private onusRepository;
    private oltCliService;
    private snmpService;
    private readonly logger;
    constructor(oltsRepository: Repository<Olt>, ponPortsRepository: Repository<PonPort>, onusRepository: Repository<Onu>, oltCliService: OltCliService, snmpService: SnmpService);
    private activeDiscoveries;
    private activeIps;
    discoverOlt(oltId: string): Promise<DiscoveryResult>;
    isDiscoveryActive(oltId: string): boolean;
    isIpDiscoveryActive(ip: string): boolean;
    private performDiscoverySteps;
    getOnusLive(olt: Olt, detectedSysObjectID?: string): Promise<any[]>;
    private discoverIdentity;
    private discoverIdentityViaCli;
    private discoverPonPorts;
    private discoverPonPortsViaCli;
    private discoverUplinkPower;
    private discoverOnuPowerCapability;
    private discoverOnusViaCli;
    private normalizePonPort;
    saveDiscoveryResults(oltId: string, result: DiscoveryResult, forceReset?: boolean): Promise<void>;
}
