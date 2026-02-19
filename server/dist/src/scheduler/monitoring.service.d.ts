import { NetworkElementsService } from '../network-elements/network-elements.service';
export declare class MonitoringService {
    private readonly networkElementsService;
    private readonly logger;
    constructor(networkElementsService: NetworkElementsService);
    handleCron(): Promise<void>;
}
