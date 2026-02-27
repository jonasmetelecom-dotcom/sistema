"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MikrotikApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MikrotikApiService = void 0;
const common_1 = require("@nestjs/common");
const mikro_routeros_1 = require("mikro-routeros");
let MikrotikApiService = MikrotikApiService_1 = class MikrotikApiService {
    logger = new common_1.Logger(MikrotikApiService_1.name);
    connections = new Map();
    async connect(config) {
        const key = `${config.host}:${config.port || 8728}`;
        if (this.connections.has(key)) {
            const existing = this.connections.get(key);
            if (existing) {
                try {
                    await existing.runQuery('/system/identity/print');
                    return existing;
                }
                catch (e) {
                    this.logger.warn(`Existing connection to ${key} is dead, reconnecting...`);
                    this.connections.delete(key);
                }
            }
        }
        try {
            const client = new mikro_routeros_1.RouterOSClient(config.host, config.port || 8728, config.timeout || 10000);
            await client.connect();
            await client.login(config.username, config.password);
            this.connections.set(key, client);
            this.logger.log(`Connected to MikroTik at ${key} via API`);
            return client;
        }
        catch (error) {
            this.logger.error(`Failed to connect to ${key}: ${error.message}`);
            throw error;
        }
    }
    async getResourceStats(config) {
        try {
            const client = await this.connect(config);
            const response = await client.runQuery('/system/resource/print');
            if (!response || response.length === 0) {
                throw new Error('No response from /system/resource/print');
            }
            const resource = response[0];
            let temperature = resource['cpu-temperature'] ||
                resource['temperature'] ||
                resource['board-temperature'] ||
                undefined;
            let voltage = resource['voltage'] ||
                resource['psu1-voltage'] ||
                resource['psu-voltage'] ||
                undefined;
            if (!temperature || !voltage) {
                try {
                    const healthResponse = await client.runQuery('/system/health/print');
                    if (healthResponse && healthResponse.length > 0) {
                        const health = healthResponse[0];
                        this.logger.debug(`[MIKROTIK API] Raw health response from ${config.host}: ${JSON.stringify(health)}`);
                        temperature = temperature || health['temperature'] || health['cpu-temperature'] || health['board-temperature'];
                        voltage = voltage || health['voltage'] || health['psu1-voltage'] || health['psu-voltage'];
                    }
                }
                catch (healthErr) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get resource stats from ${config.host}: ${error.message}`);
            throw error;
        }
    }
    async getInterfaceStats(config) {
        try {
            const client = await this.connect(config);
            const interfaces = await client.runQuery('/interface/print');
            if (!interfaces || interfaces.length === 0) {
                return [];
            }
            return interfaces.map((iface, index) => {
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
        }
        catch (error) {
            this.logger.error(`Failed to get interface stats from ${config.host}: ${error.message}`);
            throw error;
        }
    }
    async getInterfaceTraffic(config) {
        try {
            const client = await this.connect(config);
            const interfaces = await client.runQuery('/interface/print', { stats: '' });
            if (!interfaces || interfaces.length === 0) {
                return [];
            }
            return interfaces.map((iface) => ({
                name: iface['name'],
                rxBps: parseInt(iface['rx-bits-per-second']) || 0,
                txBps: parseInt(iface['tx-bits-per-second']) || 0,
                rxBytes: parseInt(iface['rx-byte']) || 0,
                txBytes: parseInt(iface['tx-byte']) || 0,
                running: iface['running'] === 'true',
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get interface traffic from ${config.host}: ${error.message}`);
            throw error;
        }
    }
    async getEthernetPorts(config) {
        try {
            const client = await this.connect(config);
            const response = await client.runQuery('/interface/ethernet/print');
            if (!response || response.length === 0) {
                return [];
            }
            return response.map((item) => ({
                name: item['name'],
                running: item['running'] === 'true',
                speed: item['speed'] || 'N/A',
                duplex: item['full-duplex'] === 'true' ? 'full' : 'half',
                linkDowns: parseInt(item['link-downs']) || 0,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get ethernet ports from ${config.host}: ${error.message}`);
            throw error;
        }
    }
    async monitorPortTraffic(config, interfaceName) {
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
        }
        catch (error) {
            this.logger.error(`Failed to monitor traffic for ${interfaceName} on ${config.host}: ${error.message}`);
            return {
                interface: interfaceName,
                rxBitsPerSecond: 0,
                txBitsPerSecond: 0,
                rxPacketsPerSecond: 0,
                txPacketsPerSecond: 0
            };
        }
    }
    async disconnect(host, port = 8728) {
        const key = `${host}:${port}`;
        const client = this.connections.get(key);
        if (client) {
            try {
                await client.close();
                this.connections.delete(key);
                this.logger.log(`Disconnected from ${key}`);
            }
            catch (error) {
                this.logger.error(`Error disconnecting from ${key}: ${error.message}`);
            }
        }
    }
    async disconnectAll() {
        for (const [key, client] of this.connections.entries()) {
            try {
                client.close();
                this.logger.log(`Closed connection to ${key}`);
            }
            catch (e) {
                this.logger.error(`Error closing ${key}: ${e.message}`);
            }
        }
        this.connections.clear();
        this.logger.log('All MikroTik API connections closed');
    }
};
exports.MikrotikApiService = MikrotikApiService;
exports.MikrotikApiService = MikrotikApiService = MikrotikApiService_1 = __decorate([
    (0, common_1.Injectable)()
], MikrotikApiService);
//# sourceMappingURL=mikrotik-api.service.js.map