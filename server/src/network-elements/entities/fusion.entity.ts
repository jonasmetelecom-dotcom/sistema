import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
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
  originFiberIndex: number; // 1-based index

  @Column()
  destinationId: string; // ID of the destination element

  @Column()
  destinationType: string; // 'cable' | 'splitter'

  @Column()
  destinationFiberIndex: number; // 1-based index

  @Column({ nullable: true })
  color: string; // Optional: color code of the fiber

  @Column({ nullable: true })
  attenuation: number; // dB loss

  @DeleteDateColumn()
  deletedAt: Date;
}
