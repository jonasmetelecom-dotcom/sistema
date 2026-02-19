import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity()
export class Rbs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ipAddress: string; // Public or Private IP

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ default: 161 })
  port: number;

  @Column()
  community: string; // SNMP Community

  @Column({ nullable: true })
  model: string; // e.g., 'CCR1009'

  // MikroTik API Credentials
  @Column({ nullable: true })
  apiUsername: string;

  @Column({ nullable: true, select: false })
  apiPassword: string;

  @Column({ default: 8728 })
  apiPort: number;

  @Column({ default: 'api' })
  monitoringMethod: 'api' | 'snmp' | 'ping';

  // Monitoring Data (Last Poll)
  @Column({ nullable: true })
  uptime: string;

  @Column({ default: 'offline' })
  status: string; // 'online' | 'offline'

  @Column({ nullable: true })
  lastSeen: Date;

  @Column('float', { nullable: true })
  cpuLoad: number; // Percentage

  @Column('float', { nullable: true })
  totalMemory: number; // Bytes

  @Column('float', { nullable: true })
  freeMemory: number; // Bytes

  @Column('float', { nullable: true })
  temperature: number; // Celsius

  @Column('float', { nullable: true })
  voltage: number; // Volts

  @ManyToOne(() => Project, (project) => project.rbs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  maintenanceUntil: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string;
}
