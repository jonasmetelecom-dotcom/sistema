import { Injectable, Logger } from '@nestjs/common';
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


@Injectable()
export class MikrotikApiService {
    private readonly logger = new Logger(MikrotikApiService.name);
    private connections: Map<string, RouterOSClient> = new Map();

    /**
     * Connect to a MikroTik device via API
     */
    async connect(config: MikrotikConnection): Promise<RouterOSClient> {
        const key = `${config.host}:${config.port || 8728}`;

        // Reuse existing connection if available
        if (this.connections.has(key)) {
            const existing = this.connections.get(key);
            if (existing) {
                try {
                    // Test if connection is still alive
                    await existing.runQuery('/system/identity/print');
                    return existing;
                } catch (e: any) {
                    this.logger.warn(`Existing connection to ${key} is dead, reconnecting...`);
                    this.connections.delete(key);
                }
            }
        }

        try {
            const client = new RouterOSClient(
                config.host,
                config.port || 8728,
                config.timeout || 10000,
            );

            await client.connect();
            await client.login(config.username, config.password);

            this.connections.set(key, client);
            this.logger.log(`Connected to MikroTik at ${key} via API`);
            return client;
        } catch (error: any) {
            this.logger.error(`Failed to connect to ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get system resource stats (CPU, Memory, Uptime)
     */
    async getResourceStats(config: MikrotikConnection): Promise<ResourceStats> {
        try {
            const client = await this.connect(config);
            const response = await client.runQuery('/system/resource/print');

            if (!response || response.length === 0) {
                throw new Error('No response from /system/resource/print');
            }

            const resource = response[0];

            // Try to find voltage and temperature in /system/resource first
            let temperature =
                resource['cpu-temperature'] ||
                resource['temperature'] ||
                resource['board-temperature'] ||
                undefined;

            let voltage =
                resource['voltage'] ||
                resource['psu1-voltage'] ||
                resource['psu-voltage'] ||
                undefined;

            // Fallback to /system/health if fields are missing
            if (!temperature || !voltage) {
                try {
                    const healthResponse = await client.runQuery('/system/health/print');
                    if (healthResponse && healthResponse.length > 0) {
                        const health = healthResponse[0];
                        this.logger.debug(`[MIKROTIK API] Raw health response from ${config.host}: ${JSON.stringify(health)}`);

                        temperature = temperature || health['temperature'] || health['cpu-temperature'] || health['board-temperature'];
                        voltage = voltage || health['voltage'] || health['psu1-voltage'] || health['psu-voltage'];
                    }
                } catch (healthErr) {
                    this.logger.warn(`Could not fetch /system/health from ${config.host}: ${healthErr.message}`);
                }
            }

            const stats = {
                cpuLoad: parseInt(resource['cpu-load']) || 0,
                freeMemory: parseInt(resource['free-memory']) || 0,
                totalMemory: parseInt(resource['total-memory']) || 0,
                uptime: resource['uptime'] || '0s',
                voltage: voltage ? parseFloat(voltage) : undefined,
                temperature: temperature ? parseFloat(temperature) : undefined,
            };

            this.logger.log(`[MIKROTIK API] Parsed stats from ${config.host}: CPU=${stats.cpuLoad}%, Temp=${stats.temperature}°C, Voltage=${stats.voltage}V`);

            return stats;
        } catch (error: any) {
            this.logger.error(`Failed to get resource stats from ${config.host}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get interface statistics
     */
    async getInterfaceStats(config: MikrotikConnection): Promise<InterfaceStats[]> {
        try {
            const client = await this.connect(config);
            const interfaces = await client.runQuery('/interface/print');

            if (!interfaces || interfaces.length === 0) {
                return [];
            }

            return interfaces.map((iface: any, index: number) => {
                const name = iface['name'] || iface['default-name'] || `interface-${index}`;
                const isRunning = iface['running'] === 'true' || iface['running'] === true;

                return {
                    index: index + 1,
                    name: name,
                    status: isRunning ? 'up' : 'down',
                    rxBytes: parseInt(iface['rx-byte']) || 0,
                    txBytes: parseInt(iface['tx-byte']) || 0,
                };
            });
        } catch (error: any) {
            this.logger.error(`Failed to get interface stats from ${config.host}: ${error.message}`);
            throw error;
        }
    }


    /**
     * Get real-time interface traffic (single snapshot)
     */
    async getInterfaceTraffic(config: MikrotikConnection): Promise<any[]> {
        try {
            const client = await this.connect(config);
            const interfaces = await client.runQuery('/interface/print', { stats: '' });

            if (!interfaces || interfaces.length === 0) {
                return [];
            }

            return interfaces.map((iface: any) => ({
                name: iface['name'],
                rxBps: parseInt(iface['rx-bits-per-second']) || 0,
                txBps: parseInt(iface['tx-bits-per-second']) || 0,
                rxBytes: parseInt(iface['rx-byte']) || 0,
                txBytes: parseInt(iface['tx-byte']) || 0,
                running: iface['running'] === 'true',
            }));
        } catch (error: any) {
            this.logger.error(`Failed to get interface traffic from ${config.host}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get Ethernet port status using native RouterOS API
     */
    async getEthernetPorts(config: MikrotikConnection): Promise<EthernetPort[]> {
        try {
            const client = await this.connect(config);
            const response = await client.runQuery('/interface/ethernet/print');

            if (!response || response.length === 0) {
                return [];
            }

            return response.map((item: any) => ({
                name: item['name'],
                running: item['running'] === 'true',
                speed: item['speed'] || 'N/A',
                duplex: item['full-duplex'] === 'true' ? 'full' : 'half',
                linkDowns: parseInt(item['link-downs']) || 0,
            }));
        } catch (error: any) {
            this.logger.error(`Failed to get ethernet ports from ${config.host}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Monitor real-time traffic for a specific interface using monitor-traffic command
     */
    async monitorPortTraffic(config: MikrotikConnection, interfaceName: string): Promise<PortTraffic> {
        try {
            const client = await this.connect(config);
            const response = await client.runQuery('/interface/monitor-traffic', {
                interface: interfaceName,
                once: ''
            });

            if (!response || response.length === 0) {
                return {
                    interface: interfaceName,
                    rxBitsPerSecond: 0,
                    txBitsPerSecond: 0,
                    rxPacketsPerSecond: 0,
                    txPacketsPerSecond: 0
                };
            }

            const data = response[0];
            return {
                interface: interfaceName,
                rxBitsPerSecond: parseInt(data['rx-bits-per-second']) || 0,
                txBitsPerSecond: parseInt(data['tx-bits-per-second']) || 0,
                rxPacketsPerSecond: parseInt(data['rx-packets-per-second']) || 0,
                txPacketsPerSecond: parseInt(data['tx-packets-per-second']) || 0,
            };
        } catch (error: any) {
            this.logger.error(`Failed to monitor traffic for ${interfaceName} on ${config.host}: ${error.message}`);
            // Return zeroed data instead of throwing to keep polling alive
            return {
                interface: interfaceName,
                rxBitsPerSecond: 0,
                txBitsPerSecond: 0,
                rxPacketsPerSecond: 0,
                txPacketsPerSecond: 0
            };
        }
    }

    /**
     * Disconnect from a MikroTik device
     */
    async disconnect(host: string, port: number = 8728): Promise<void> {
        const key = `${host}:${port}`;
        const client = this.connections.get(key);

        if (client) {
            try {
                await client.close();
                this.connections.delete(key);
                this.logger.log(`Disconnected from ${key}`);
            } catch (error: any) {
                this.logger.error(`Error disconnecting from ${key}: ${error.message}`);
            }
        }
    }

    /**
     * Disconnect all connections
     */
    async disconnectAll(): Promise<void> {
        for (const [key, client] of this.connections.entries()) {
            try {
                client.close();
                this.logger.log(`Closed connection to ${key}`);
            } catch (e: any) {
                this.logger.error(`Error closing ${key}: ${e.message}`);
            }
        }
        this.connections.clear();
        this.logger.log('All MikroTik API connections closed');
    }
}
