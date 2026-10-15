
// import {
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { GoogleGenAI } from '@google/genai';

// export interface ChatHistoryItem {
//   role: 'user' | 'model';
//   content: string;
// }

// @Injectable()
// export class AiService {
//   private readonly ai: GoogleGenAI;

//   constructor(private readonly configService: ConfigService) {
//     this.ai = new GoogleGenAI({
//       apiKey: this.configService.getOrThrow<string>(
//         'GEMINI_API_KEY',
//       ),
//     });
//   }

//   async generateResponse(
//     history: ChatHistoryItem[],
//     message: string,
//   ): Promise<string> {
//     try {
//       const contents = [
//         ...history.map((item) => ({
//           role: item.role,
//           parts: [{ text: item.content }],
//         })),
//         {
//           role: 'user',
//           parts: [{ text: message }],
//         },
//       ];

//       const response = await this.ai.models.generateContent({
//         model: this.configService.get<string>(
//           'GEMINI_MODEL',
//           'gemini-3.8-flash',
//         ),
//         contents,
//       });

//       if (!response.text) {
//         throw new Error('Empty AI response');
//       }

//       return response.text;
//     } catch {
//       throw new InternalServerErrorException(
//         'Unable to generate AI response. Please try again.',
//       );
//     }
//   }
// }

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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
      apiKey: this.configService.getOrThrow<string>(
        'OPENROUTER_API_KEY',
      ),
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  async generateResponse(
    history: ChatHistoryItem[],
    message: string,
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          ...history.map((item) => ({
            role: (item.role === 'model' ? 'assistant' : 'user') as
              | 'assistant'
              | 'user',
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
