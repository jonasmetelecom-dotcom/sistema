import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PortMonitoringService } from '../services/port-monitoring.service';
import { NetworkElementsService } from '../network-elements/network-elements.service';
export declare class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private portMonitoringService;
    private networkElementsService;
    server: Server;
    private readonly logger;
    private deviceSubscriptions;
    constructor(portMonitoringService: PortMonitoringService, networkElementsService: NetworkElementsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, data: {
        deviceId: string;
    }): {
        success: boolean;
        deviceId: string;
    };
    handleUnsubscribe(client: Socket, data: {
        deviceId: string;
    }): {
        success: boolean;
        deviceId: string;
    };
    broadcastDeviceUpdate(deviceId: string, data: any): void;
    broadcastDeviceStatus(deviceId: string, status: 'online' | 'offline'): void;
    getDeviceSubscribers(deviceId: string): number;
    hasSubscribers(deviceId: string): boolean;
}
