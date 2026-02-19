import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface EthernetPort {
    name: string;
    running: boolean;
    speed: string;
    duplex: string;
    linkDowns: number;
    rxBps?: number;
    txBps?: number;
}

interface PortTraffic {
    interface: string;
    rxBitsPerSecond: number;
    txBitsPerSecond: number;
}

interface MonitoringData {
    health: {
        cpuLoad: number;
        freeMemory: number;
        totalMemory: number;
        voltage: number;
        temperature: number;
        uptime: string;
    };
    interfaces: Array<{
        index: number;
        name: string;
        status: 'up' | 'down';
        inOctets: number;
        outOctets: number;
    }>;
    ports?: EthernetPort[];
    alarms: any[];
    monitoringMethod?: 'api' | 'snmp';
}


interface DeviceUpdate {
    deviceId: string;
    data: MonitoringData;
    timestamp: Date;
}

interface DeviceStatus {
    deviceId: string;
    status: 'online' | 'offline';
    timestamp: Date;
}

export const useMonitoringSocket = (deviceId: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [data, setData] = useState<MonitoringData | null>(null);
    const [status, setStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!deviceId) return;

        // Connect to WebSocket server
        const newSocket = io(`${import.meta.env.VITE_API_URL}/monitoring`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('[WS] Connected to monitoring server');
            setConnected(true);
            setStatus('connecting');

            // Subscribe to device updates
            newSocket.emit('subscribe', { deviceId });
        });

        newSocket.on('disconnect', () => {
            console.log('[WS] Disconnected from monitoring server');
            setConnected(false);
            setStatus('offline');
        });

        newSocket.on('device-update', (update: DeviceUpdate) => {
            if (update.deviceId === deviceId) {
                console.log('[WS] Received device update:', update);
                setData(update.data);
                setStatus('online');
            }
        });

        newSocket.on('device-status', (statusUpdate: DeviceStatus) => {
            if (statusUpdate.deviceId === deviceId) {
                console.log('[WS] Device status changed:', statusUpdate.status);
                setStatus(statusUpdate.status);
            }
        });

        newSocket.on('port-status', (update: { deviceId: string, ports: EthernetPort[] }) => {
            if (update.deviceId === deviceId) {
                console.log('[WS] Received port status update:', update);
                setData(prev => {
                    const base = prev || { health: {} as any, interfaces: [], alarms: [], ports: [] };
                    return {
                        ...base,
                        ports: update.ports.map(p => {
                            const existing = base.ports?.find(ep => ep.name === p.name);
                            return { ...p, rxBps: existing?.rxBps, txBps: existing?.txBps };
                        })
                    };
                });
            }
        });

        newSocket.on('port-traffic', (update: { deviceId: string, traffic: PortTraffic[] }) => {
            if (update.deviceId === deviceId) {
                console.log('[WS] Received port traffic update:', update);
                setData(prev => {
                    if (!prev || !prev.ports) return prev;
                    return {
                        ...prev,
                        ports: prev.ports.map(p => {
                            const traffic = update.traffic.find(t => t.interface === p.name);
                            return traffic ? {
                                ...p,
                                rxBps: traffic.rxBitsPerSecond,
                                txBps: traffic.txBitsPerSecond
                            } : p;
                        })
                    };
                });
            }
        });


        newSocket.on('connect_error', (error) => {
            console.error('[WS] Connection error:', error);
            setStatus('offline');
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.emit('unsubscribe', { deviceId });
                newSocket.close();
            }
        };
    }, [deviceId]);

    const refresh = useCallback(() => {
        if (socket && deviceId) {
            // Trigger a manual refresh by re-subscribing
            socket.emit('subscribe', { deviceId });
        }
    }, [socket, deviceId]);

    return {
        data,
        status,
        connected,
        refresh,
    };
};
