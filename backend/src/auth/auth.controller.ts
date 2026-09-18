import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация' })
  @ApiResponse({ status: 201, description: 'Пользователь создан, выдан токен' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  // Вход ничего не создаёт — отвечаем 200, а не 201.
  @HttpCode(200)
  @ApiOperation({ summary: 'Вход' })
  @ApiResponse({ status: 200, description: 'Токен выдан' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Кто я (проверка токена)' })
  @ApiResponse({ status: 200, description: 'Данные из токена' })
  @ApiResponse({ status: 401, description: 'Токен отсутствует или невалиден' })
  me(@Req() req: { user: unknown }) {
    return req.user;
  }
}
