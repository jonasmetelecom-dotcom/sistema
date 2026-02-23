import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    deviceId: string; // Fingerprint or generated ID from frontend

    @Column({ nullable: true })
    deviceName: string; // e.g., "iPhone 13", "Chrome Windows"

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ type: 'float', nullable: true })
    latitude: number;

    @Column({ type: 'float', nullable: true })
    longitude: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ nullable: true })
    tenantId: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastSeen: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
