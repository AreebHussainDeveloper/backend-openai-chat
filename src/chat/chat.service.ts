import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiService } from '../ai/ai.service.js';
import { ChatEntity } from './entities/chat.entity.js';
import { MessageEntity, MessageRole } from './entities/message.entity.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,

    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,

    private readonly aiService: AiService,
  ) {}

  async createChat(userId: number, title?: string) {
    const chat = this.chatRepository.create({
      userId,
      title: title?.trim() || 'New chat',
    });

    return this.chatRepository.save(chat);
  }

  async getChats(userId: number) {
    return this.chatRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMessages(userId: number, chatId: number) {
    await this.findOwnedChat(userId, chatId);

    return this.messageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(userId: number, chatId: number, message: string) {
    const chat = await this.findOwnedChat(userId, chatId);

    // Load previous conversation before saving the new message.
    const previousMessages = await this.messageRepository.find({
      where: { chatId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const history = previousMessages.reverse().map((item) => ({
      role:
        item.role === MessageRole.USER ? ('user' as const) : ('model' as const),
      content: item.content,
    }));

    // Save the user's message.
    const userMessage = this.messageRepository.create({
      chatId,
      role: MessageRole.USER,
      content: message,
    });

    await this.messageRepository.save(userMessage);

    // Generate an AI answer using the conversation history.
    const answer = await this.aiService.generateResponse(history, message);

    // Save the AI response.
    const assistantMessage = this.messageRepository.create({
      chatId,
      role: MessageRole.ASSISTANT,
      content: answer,
    });

    await this.messageRepository.save(assistantMessage);

    // Use the first message as the chat title.
    if (chat.title === 'New chat') {
      chat.title = message.length > 60 ? `${message.slice(0, 57)}...` : message;
    }

    await this.chatRepository.save(chat);

    return {
      chatId,
      userMessage,
      assistantMessage,
    };
  }

  async deleteChat(userId: number, chatId: number) {
    const chat = await this.findOwnedChat(userId, chatId);

    await this.chatRepository.remove(chat);

    return {
      message: 'Chat deleted successfully',
    };
  }

  private async findOwnedChat(
    userId: number,
    chatId: number,
  ): Promise<ChatEntity> {
    const chat = await this.chatRepository.findOne({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }
}
