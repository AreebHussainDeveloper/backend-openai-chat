import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ChatService } from './chat.service.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  createChat(
    @Req() req: any,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatService.createChat(
      req.user.id,
      dto.title,
    );
  }

  @Get()
  getChats(@Req() req: any) {
    return this.chatService.getChats(req.user.id);
  }

  @Get(':id/messages')
  getMessages(@Req() req: any, @Param('id') chatId: number) {
    return this.chatService.getMessages(req.user.id, chatId);
  }

  @Post(':id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') chatId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      req.user.id,
      chatId,
      dto.message,
    );
  }

  @Delete(':id')
  deleteChat(@Req() req: any, @Param('id') chatId: number) {
    return this.chatService.deleteChat(req.user.id, chatId);
  }
}