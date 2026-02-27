import { Repository } from 'typeorm';
import { MikrotikApiService } from './mikrotik-api.service';
import { MonitoringGateway } from '../gateways/monitoring.gateway';
import { Rbs } from '../network-elements/entities/rbs.entity';
export declare class PortMonitoringService {
    private rbsRepository;
    private mikrotikApiService;
    private monitoringGateway;
    private readonly logger;
    private trafficPollers;
    private statusPollers;
    private deviceConfigs;
    private lastPortStatus;
    constructor(rbsRepository: Repository<Rbs>, mikrotikApiService: MikrotikApiService, monitoringGateway: MonitoringGateway);
    startMonitoring(deviceId: string, tenantId?: string): Promise<void>;
    stopMonitoring(deviceId: string): Promise<void>;
    private pollTraffic;
    private pollStatus;
}
