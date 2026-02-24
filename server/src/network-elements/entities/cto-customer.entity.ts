import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Unique,
} from 'typeorm';
import { InfrastructureBox } from './box.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('cto_customers')
@Unique(['boxId', 'portIndex', 'deletedAt']) // Prevent duplicate customers on same port
export class CtoCustomer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    boxId: string;

    @ManyToOne(() => InfrastructureBox)
    @JoinColumn({ name: 'boxId' })
    box: InfrastructureBox;

    @Column({ nullable: true })
    splitterId: string; // Optional: customer might be connected directly to a splitter or just a port if simplified

    @Column()
    portIndex: number; // 1-based index

    @Column()
    name: string; // Customer name

    @Column({ nullable: true })
    externalId: string; // ID from external system (IXC, MK-Auth, etc)

    @Column({ default: 'active' })
    status: string; // active, reserved, blocked, free

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    observation: string;

    @Column()
    projectId: string;

    @ManyToOne(() => Project)
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
