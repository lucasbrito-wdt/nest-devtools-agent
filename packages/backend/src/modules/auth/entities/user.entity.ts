import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  password?: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId?: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'oauth_provider', type: 'text', nullable: true })
  oauthProvider?: string;

  @Column({ name: 'oauth_id', type: 'text', nullable: true })
  oauthId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
