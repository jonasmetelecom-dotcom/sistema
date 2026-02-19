import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { InfrastructureBox } from './box.entity';

@Entity('splitters')
export class Splitter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  boxId: string;

  @ManyToOne(() => InfrastructureBox)
  @JoinColumn({ name: 'boxId' })
  box: InfrastructureBox;

  @Column()
  projectId: string;

  @Column({ default: '1:8' })
  type: string; // 1:8, 1:16, 1:2, etc.

  @Column({ default: 'APC' })
  connectorType: string; // 'APC' (Green), 'UPC' (Blue), 'None' (Fusion)

  @Column({ default: 'balanced' })
  structure: string; // 'balanced', 'unbalanced'

  // Optional: Store Label or visual position
  @Column({ nullable: true })
  label: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
