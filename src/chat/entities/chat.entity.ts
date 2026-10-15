import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { MessageEntity } from './message.entity.js';

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'userId', type: 'integer' })
  userId: number;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'New chat',
  })
  title: string;

  @OneToMany(() => MessageEntity, (message) => message.chat)
  messages: Relation<MessageEntity[]>;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}