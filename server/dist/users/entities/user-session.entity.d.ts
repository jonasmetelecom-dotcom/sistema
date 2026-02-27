import { User } from './user.entity';
export declare class UserSession {
    id: string;
    deviceId: string;
    deviceName: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
    user: User;
    userId: string;
    tenantId: string;
    isActive: boolean;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
}
