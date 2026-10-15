import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
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
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    nullable: true,
    select: false,
  })
  resetTokenHash: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  resetTokenExpiresAt: Date | null;

  @Column({
    type: 'varchar',
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    select: false,
  })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
