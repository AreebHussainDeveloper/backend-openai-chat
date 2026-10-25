import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'areeb@yopmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Areeb Hussain' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @MinLength(8)
  password: string;
}
