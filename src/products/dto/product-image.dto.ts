
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsUrl,
  Min,
} from 'class-validator';

export class ProductImageDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({
    example: 'https://example.com/images/headphones.jpg',
  })
  @IsUrl({ require_protocol: true })
  url: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isThumbnail: boolean;
}
