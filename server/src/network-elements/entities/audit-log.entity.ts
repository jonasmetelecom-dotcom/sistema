import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | 'POLL' | 'LOGIN'

  @Column()
  entityType: string; // 'OLT' | 'RBS' | 'ONU' | 'PROJECT' | 'BOX' | 'CABLE'

  @Column()
  entityId: string;

  @Column({ type: 'text', nullable: true })
  details: string; // JSON string of changes

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  tenantId: string;
}
