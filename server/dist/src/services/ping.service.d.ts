interface PingResult {
    online: boolean;
    responseTime?: number;
    packetLoss?: number;
}
export declare class PingService {
    private readonly logger;
    ping(host: string, count?: number): Promise<PingResult>;
    quickPing(host: string): Promise<boolean>;
}
export {};
