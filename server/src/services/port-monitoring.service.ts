import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MikrotikApiService } from './mikrotik-api.service';
import { MonitoringGateway } from '../gateways/monitoring.gateway';
import { Rbs } from '../network-elements/entities/rbs.entity';

@Injectable()
export class PortMonitoringService {
    private readonly logger = new Logger(PortMonitoringService.name);
    private trafficPollers = new Map<string, NodeJS.Timeout>();
    private statusPollers = new Map<string, NodeJS.Timeout>();
    private deviceConfigs = new Map<string, any>();
    private lastPortStatus = new Map<string, any[]>();


    constructor(
        @InjectRepository(Rbs)
        private rbsRepository: Repository<Rbs>,
        private mikrotikApiService: MikrotikApiService,
        @Inject(forwardRef(() => MonitoringGateway))
        private monitoringGateway: MonitoringGateway,
    ) { }


    async startMonitoring(deviceId: string, tenantId?: string) {
        if (this.trafficPollers.has(deviceId)) {
            return;
        }

        const rbs = await this.rbsRepository.findOne({ where: { id: deviceId } });
        if (!rbs || rbs.monitoringMethod !== 'api' || !rbs.apiUsername || !rbs.apiPassword) {
            this.logger.warn(`Cannot start port monitoring for device ${deviceId}: Missing API config`);
            return;
        }

        const config = {
            host: rbs.ipAddress,
            username: rbs.apiUsername,
            password: rbs.apiPassword,
            port: rbs.apiPort || 8728,
        };

        this.deviceConfigs.set(deviceId, config);
        this.logger.log(`Starting high-frequency port monitoring for device ${deviceId}`);

        // Initial fetch of port status to have an immediate base
        await this.pollStatus(deviceId);

        // Traffic polling every 1.5s (average of 1-2s range)
        const trafficPoller = setInterval(() => this.pollTraffic(deviceId), 1500);
        this.trafficPollers.set(deviceId, trafficPoller);

        // Status polling every 4s (average of 3-5s range)
        const statusPoller = setInterval(() => this.pollStatus(deviceId), 4000);
        this.statusPollers.set(deviceId, statusPoller);
    }

    async stopMonitoring(deviceId: string) {
        this.logger.log(`Stopping port monitoring for device ${deviceId}`);

        if (this.trafficPollers.has(deviceId)) {
            clearInterval(this.trafficPollers.get(deviceId)!);
            this.trafficPollers.delete(deviceId);
        }

        if (this.statusPollers.has(deviceId)) {
            clearInterval(this.statusPollers.get(deviceId)!);
            this.statusPollers.delete(deviceId);
        }

        this.deviceConfigs.delete(deviceId);
        this.lastPortStatus.delete(deviceId);
    }

    private async pollTraffic(deviceId: string) {
        const config = this.deviceConfigs.get(deviceId);
        if (!config) return;

        try {
            const ports = this.lastPortStatus.get(deviceId) || [];
            if (ports.length === 0) return;

            // Monitor traffic for each ethernet port
            const trafficResults = await Promise.all(
                ports.map(async (port) => {
                    return this.mikrotikApiService.monitorPortTraffic(config, port.name);
                })
            );

            this.monitoringGateway.server.to(`device:${deviceId}`).emit('port-traffic', {
                deviceId,
                traffic: trafficResults,
                timestamp: new Date()
            });
        } catch (error: any) {
            this.logger.error(`Error polling traffic for device ${deviceId}: ${error.message}`);
        }
    }

    private async pollStatus(deviceId: string) {
        const config = this.deviceConfigs.get(deviceId);
        if (!config) return;

        try {
            const ports = await this.mikrotikApiService.getEthernetPorts(config);
            this.lastPortStatus.set(deviceId, ports);

            this.monitoringGateway.server.to(`device:${deviceId}`).emit('port-status', {
                deviceId,
                ports,
                timestamp: new Date()
            });
        } catch (error: any) {
            this.logger.error(`Error polling status for device ${deviceId}: ${error.message}`);
        }
    }
}
