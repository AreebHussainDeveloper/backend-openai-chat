import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

@Injectable()
export class AiService {
  private readonly ai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {
    this.ai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generateResponse(
    history: ChatHistoryItem[],
    message: string,
  ): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        ...history.map((item): ChatCompletionMessageParam => ({
          role: item.role === 'model' ? 'assistant' : 'user',
          content: item.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await this.ai.chat.completions.create({
        model: this.configService.get<string>(
          'OPENROUTER_MODEL',
          'openrouter/free',
        ),
        messages,
      });

      const answer = response.choices[0]?.message?.content;

      if (typeof answer !== 'string' || !answer.trim()) {
        throw new Error('Empty AI response');
      }

      return answer;
    } catch (error) {
      this.logger.error(
        'OpenRouter request failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to generate AI response. Please try again.',
      );
    }
  }
}
