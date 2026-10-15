import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'areeb@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Areeb Hussain' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}
