import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Alarm } from './alarm.entity';
import { InfrastructureBox } from './box.entity';

@Entity()
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @Column({ default: 'MEDIUM' })
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ nullable: true })
  assignedTo: string; // User ID of the technician

  @Column({ nullable: true })
  technicianName: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  boxId: string;

  @Column({ nullable: true })
  alarmId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
