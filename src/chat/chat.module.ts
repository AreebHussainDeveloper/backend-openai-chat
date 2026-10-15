import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from '../ai/ai.module.js';
import { ChatEntity } from './entities/chat.entity.js';
import { MessageEntity } from './entities/message.entity.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatEntity, MessageEntity]),
    AuthModule,
    AiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
