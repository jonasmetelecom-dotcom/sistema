import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Alarm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'olt_down' | 'rbs_down' | 'onu_down' | 'high_cpu' | 'high_temp'

  @Column()
  severity: string; // 'critical' | 'warning' | 'info'

  @Column()
  deviceId: string; // ID of the OLT, RBS, or ONU

  @Column()
  deviceName: string;

  @Column()
  message: string;

  @Column({ default: false })
  isAcknowledged: boolean;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string; // For multi-tenancy

  @Column({ nullable: true })
  assignedTo: string; // User ID of the technician

  @Column({ nullable: true })
  slaDeadline: Date;
}
