import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PingResult {
    online: boolean;
    responseTime?: number;
    packetLoss?: number;
}

@Injectable()
export class PingService {
    private readonly logger = new Logger(PingService.name);

    /**
     * Ping a host to check connectivity
     */
    async ping(host: string, count: number = 4): Promise<PingResult> {
        try {
            // Windows ping command
            const { stdout } = await execAsync(`ping -n ${count} ${host}`, {
                timeout: 10000,
            });

            // Parse ping output
            const timeMatch = stdout.match(/Average = (\d+)ms/i);
            const lossMatch = stdout.match(/\((\d+)% loss\)/i);

            const responseTime = timeMatch ? parseInt(timeMatch[1]) : undefined;
            const packetLoss = lossMatch ? parseInt(lossMatch[1]) : 100;

            return {
                online: packetLoss < 100,
                responseTime,
                packetLoss,
            };
        } catch (error: any) {
            this.logger.error(`Ping failed for ${host}: ${error.message}`);
            return {
                online: false,
                packetLoss: 100,
            };
        }
    }

    /**
     * Quick ping check (1 packet)
     */
    async quickPing(host: string): Promise<boolean> {
        const result = await this.ping(host, 1);
        return result.online;
    }
}
