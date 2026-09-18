import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  // Верхняя граница не для красоты: bcrypt обрезает вход на 72 байтах,
  // а очень длинный пароль — дешёвый способ нагрузить CPU на хешировании.
  @ApiProperty({ example: 'СильныйПароль123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
