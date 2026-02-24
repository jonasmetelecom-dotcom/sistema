import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('fusions')
@Index(['destinationId', 'destinationFiberIndex', 'deletedAt'], { unique: true, where: '"destinationType" = \'splitter\'' })
export class Fusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  boxId: string; // The box where this fusion is located

  @Column()
  originId: string; // ID of the source element (Cable or Splitter)

  @Column()
  originType: string; // 'cable' | 'splitter'

  @Column()
  originFiberIndex: number; // 1-based index or port number

  @Column()
  destinationId: string; // ID of the destination element

  @Column()
  destinationType: string; // 'cable' | 'splitter'

  @Column()
  destinationFiberIndex: number; // 1-based index or port number

  // New fields for advanced module
  @Column({ nullable: true })
  userResponsible: string;

  @Column({ type: 'text', nullable: true })
  history: string;

  @Column({ nullable: true })
  color: string; // Optional: color code of the fiber

  @Column({ nullable: true })
  attenuation: number; // dB loss

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
