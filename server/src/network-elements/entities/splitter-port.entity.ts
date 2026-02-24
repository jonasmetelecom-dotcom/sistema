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
import { Splitter } from './splitter.entity';

@Entity('splitter_ports')
export class SplitterPort {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    boxId: string;

    @ManyToOne(() => InfrastructureBox)
    @JoinColumn({ name: 'boxId' })
    box: InfrastructureBox;

    @Column()
    splitterId: string;

    @ManyToOne(() => Splitter)
    @JoinColumn({ name: 'splitterId' })
    splitter: Splitter;

    @Column()
    portIndex: number; // 1-based index

    @Column({ default: 'free' })
    status: string; // free, occupied, reserved, damaged

    @Column({ nullable: true })
    customerName: string;

    @Column({ nullable: true })
    customerId: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    projectId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
