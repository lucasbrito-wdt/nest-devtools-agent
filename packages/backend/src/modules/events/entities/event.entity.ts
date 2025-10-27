import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { EventType } from '@nest-devtools/shared';

/**
 * Entidade que representa um evento capturado pelo DevTools
 */
@Entity('events')
@Index(['projectId'])
@Index(['type'])
@Index(['route'])
@Index(['status'])
@Index(['createdAt'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId?: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type!: EventType;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  route?: string;

  @Column({ type: 'int', nullable: true })
  status?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
