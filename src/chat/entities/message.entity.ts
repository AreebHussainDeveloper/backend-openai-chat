import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ChatEntity } from './chat.entity.js';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('messages')
@Index(['chatId', 'createdAt'])
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'chatId' })
  chatId: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chatId' })
  chat: Relation<ChatEntity>;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
