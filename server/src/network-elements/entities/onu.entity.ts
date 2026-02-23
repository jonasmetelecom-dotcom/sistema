import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Olt } from './olt.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity()
export class Onu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  name: string; // Customer Name or Description

  @Column({ nullable: true })
  ponPort: string; // e.g., '1/1/1'

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column('float', { nullable: true })
  signalLevel: number; // Received Optical Power (dBm)

  @Column({ default: 'offline' })
  status: string; // 'online', 'offline', 'los', 'planned'

  @Column({ default: false })
  isAuthorized: boolean;

  @Column({ nullable: true })
  lastSeen: Date;

  @ManyToOne(() => Project, (project) => project.onus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => Olt, (olt) => olt.onus, { onDelete: 'CASCADE', nullable: true })
  olt: Olt;

  @Column({ nullable: true })
  oltId: string;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
