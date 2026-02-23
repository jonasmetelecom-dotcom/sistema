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
import { Project } from '../../projects/entities/project.entity';

@Entity('cables')
export class Cable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ default: 'drop' })
  type: string; // drop, as80, as120, underground

  @Column({ default: 1 })
  fiberCount: number;

  // Storing path as JSON for SQLite compatibility
  @Column('simple-json')
  points: { lat: number; lng: number }[];

  @ManyToOne(() => Project, (project) => project.cables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  // Connectivity
  @Column({ nullable: true })
  fromId: string; // ID of the starting element (Box/Pole)

  @Column({ nullable: true })
  fromType: string; // 'box' | 'pole'

  @Column({ nullable: true })
  toId: string; // ID of the ending element

  @Column({ nullable: true })
  toType: string; // 'box' | 'pole'

  @Column({ nullable: true })
  level: string;

  @Column({ nullable: true })
  tags: string;

  @Column({ nullable: true })
  colors: string;

  @Column({ type: 'float', default: 0 })
  length3D: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'float', default: 0 })
  slack: number;

  @Column({ nullable: true })
  status: string; // deployed, planned

  @Column({ default: 1 })
  looses: number;

  @Column({ nullable: true })
  observations: string;

  @Column({ type: 'simple-json', nullable: true })
  poleIds: string[]; // Track intermediate poles

  @Column({ default: 0 })
  occupation: number;

  @Column({ type: 'simple-json', nullable: true })
  reserves: { poleId: string; length: number }[]; // Technical reserves per pole

  @DeleteDateColumn()
  deletedAt: Date;
}
