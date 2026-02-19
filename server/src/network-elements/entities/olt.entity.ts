import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Onu } from './onu.entity';
import { PonPort } from './pon-port.entity';

@Entity()
export class Olt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ipAddress: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ default: 161 })
  port: number;

  @Column()
  community: string; // SNMP Community String (e.g., 'public')

  @Column({ nullable: true })
  model: string; // e.g., 'Huawei', 'ZTE', 'Nokia'

  @Column({ nullable: true })
  firmwareVersion: string;

  @Column({ default: 'auto' })
  monitoringMethod: 'snmp' | 'cli' | 'auto'; // How to fetch signals/status

  // Monitoring Data
  @Column({ nullable: true })
  uptime: string;

  @Column({ default: 'offline' })
  status: string; // 'online' | 'offline'

  @Column({ nullable: true })
  lastSeen: Date;

  @ManyToOne(() => Project, (project) => project.olts, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @OneToMany(() => Onu, (onu) => onu.olt)
  onus: Onu[];

  @OneToMany(() => PonPort, (ponPort) => ponPort.olt)
  ponPorts: PonPort[];

  @Column({ nullable: true })
  maintenanceUntil: Date;

  // Discovery fields
  @Column({ nullable: true })
  sysDescr: string;

  @Column({ nullable: true })
  sysObjectID: string;

  @Column({ type: 'json', nullable: true })
  capabilities: {
    pon_status_snmp: boolean;
    pon_traffic_snmp: boolean;
    uplink_power_snmp: boolean;
    onu_power_snmp: boolean;
    onu_power_cli: 'unknown' | 'true' | 'false';
  };

  @Column({ type: 'json', nullable: true })
  discoveryResults: {
    lastRun: Date;
    status: 'success' | 'partial' | 'failed' | 'running';
    errors: string[];
  };

  // CLI Credentials
  @Column({ nullable: true, default: 'ssh' })
  cliProtocol: 'ssh' | 'telnet';

  @Column({ nullable: true })
  cliUsername: string;

  @Column({ nullable: true, select: false })
  cliPassword: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string;
}
