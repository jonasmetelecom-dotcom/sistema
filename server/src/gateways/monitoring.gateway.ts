import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { PortMonitoringService } from '../services/port-monitoring.service';
import { NetworkElementsService } from '../network-elements/network-elements.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/monitoring',
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MonitoringGateway.name);
    private deviceSubscriptions: Map<string, Set<string>> = new Map(); // deviceId -> Set of socketIds

    constructor(
        @Inject(forwardRef(() => PortMonitoringService))
        private portMonitoringService: PortMonitoringService,
        @Inject(forwardRef(() => NetworkElementsService))
        private networkElementsService: NetworkElementsService,
    ) { }


    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Clean up subscriptions
        this.deviceSubscriptions.forEach((subscribers, deviceId) => {
            subscribers.delete(client.id);
            if (subscribers.size === 0) {
                this.deviceSubscriptions.delete(deviceId);
            }
        });
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { deviceId: string },
    ) {
        const { deviceId } = data;

        if (!this.deviceSubscriptions.has(deviceId)) {
            this.deviceSubscriptions.set(deviceId, new Set());
        }

        const subscribers = this.deviceSubscriptions.get(deviceId)!;
        subscribers.add(client.id);

        // Join the socket.io room for this device
        client.join(`device:${deviceId}`);

        this.logger.log(`Client ${client.id} subscribed to device ${deviceId}`);

        // Trigger immediate full monitoring update
        // We find the RBS to get the tenantId
        this.networkElementsService.getAllRbs().then(rbsList => {
            const rb = rbsList.find(r => r.id === deviceId);
            if (rb) {
                this.networkElementsService.getRbsMonitoring(rb.id, rb.tenantId);
            }
        }).catch(err => this.logger.error(`Error triggering immediate RBS update: ${err.message}`));

        // Start high-frequency port monitoring if it's the first subscriber
        if (subscribers.size === 1) {
            this.portMonitoringService.startMonitoring(deviceId);
        }

        return { success: true, deviceId };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { deviceId: string },
    ) {
        const { deviceId } = data;

        const subscribers = this.deviceSubscriptions.get(deviceId);
        if (subscribers) {
            subscribers.delete(client.id);

            if (subscribers.size === 0) {
                this.deviceSubscriptions.delete(deviceId);
                // Stop high-frequency port monitoring
                this.portMonitoringService.stopMonitoring(deviceId);
            }
        }

        this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);


        return { success: true, deviceId };
    }

    /**
     * Broadcast device status update to all subscribed clients
     */
    broadcastDeviceUpdate(deviceId: string, data: any) {
        const subscribers = this.deviceSubscriptions.get(deviceId);

        if (subscribers && subscribers.size > 0) {
            subscribers.forEach((socketId) => {
                this.server.to(socketId).emit('device-update', {
                    deviceId,
                    data,
                    timestamp: new Date(),
                });
            });

            this.logger.debug(`Broadcasted update for device ${deviceId} to ${subscribers.size} clients`);
        }
    }

    /**
     * Broadcast device status change (online/offline)
     */
    broadcastDeviceStatus(deviceId: string, status: 'online' | 'offline') {
        this.server.emit('device-status', {
            deviceId,
            status,
            timestamp: new Date(),
        });

        this.logger.log(`Broadcasted status change for device ${deviceId}: ${status}`);
    }

    /**
     * Get active subscriptions for a device
     */
    getDeviceSubscribers(deviceId: string): number {
        return this.deviceSubscriptions.get(deviceId)?.size || 0;
    }

    /**
     * Check if any client is subscribed to a device
     */
    hasSubscribers(deviceId: string): boolean {
        return this.getDeviceSubscribers(deviceId) > 0;
    }
}
