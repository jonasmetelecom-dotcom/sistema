import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Olt } from '../../network-elements/entities/olt.entity';
import { Rbs } from '../../network-elements/entities/rbs.entity';
import { Pole } from '../../network-elements/entities/pole.entity';
import { InfrastructureBox } from '../../network-elements/entities/box.entity';
import { Cable } from '../../network-elements/entities/cable.entity';
import { Onu } from '../../network-elements/entities/onu.entity';
import type { Point } from 'geojson';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @OneToMany(() => Olt, (olt) => olt.project)
  olts: Olt[];

  @OneToMany(() => Rbs, (rbs) => rbs.project)
  rbs: Rbs[];

  @OneToMany(() => Pole, (pole) => pole.project)
  poles: Pole[];

  @OneToMany(() => InfrastructureBox, (box) => box.project)
  boxes: InfrastructureBox[];

  @OneToMany(() => Cable, (cable) => cable.project)
  cables: Cable[];

  @OneToMany(() => Onu, (onu) => onu.project)
  onus: Onu[];

  @Column({ default: 'draft' })
  status: string; // 'draft', 'approved', 'built'

  @Column({ type: 'simple-json', nullable: true })
  settings: {
    prices?: {
      pole?: number;
      box?: Record<string, number>;
      cable?: Record<string, number>;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
