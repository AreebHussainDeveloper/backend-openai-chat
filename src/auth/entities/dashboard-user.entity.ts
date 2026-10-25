import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DashboardRole } from '../enums/dashboard-role.enum.js';

@Entity('dashboard_users')
export class DashboardUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: DashboardRole,
    default: DashboardRole.STAFF,
  })
  role: DashboardRole;

  @Column({ type: 'varchar', nullable: true, select: false })
  resetTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  resetTokenExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
