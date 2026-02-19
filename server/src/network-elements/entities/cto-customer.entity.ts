import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { InfrastructureBox } from './box.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('cto_customers')
export class CtoCustomer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    boxId: string;

    @ManyToOne(() => InfrastructureBox)
    @JoinColumn({ name: 'boxId' })
    box: InfrastructureBox;

    @Column()
    splitterId: string;

    @Column()
    portIndex: number; // 1-based index of the splitter output

    @Column()
    name: string; // Customer name or label

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
}
