import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Olt } from './olt.entity';

@Entity('pon_ports')
export class PonPort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  oltId: string;

  @Column()
  ifIndex: number;

  @Column()
  ifDescr: string;

  @Column()
  ifOperStatus: number; // 1=up, 2=down

  @Column({ type: 'bigint', default: 0 })
  ifInOctets: number;

  @Column({ type: 'bigint', default: 0 })
  ifOutOctets: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdated: Date;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => Olt, (olt) => olt.ponPorts, { onDelete: 'CASCADE' })
  olt: Olt;
}
