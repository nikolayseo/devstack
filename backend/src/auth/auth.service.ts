import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

/**
 * Заготовленный хеш несуществующего пароля.
 * Нужен, чтобы вход с несуществующим email занимал столько же времени,
 * сколько вход с существующим, — иначе по времени ответа можно перебрать,
 * какие адреса зарегистрированы (timing attack / user enumeration).
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1nQ8p8hPqXZ0KQXnQ0aVvVqKZ8tVQ4y';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 12 раундов — текущий разумный компромисс скорость/стойкость.
    // Соль bcrypt генерирует сам и кладёт внутрь хеша.
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const saved = await this.users.save(
      this.users.create({ email: dto.email, passwordHash }),
    );

    return this.sign(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email } });

    // Сравниваем всегда, даже если пользователя нет.
    const matches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);

    // Одинаковая ошибка для обоих случаев — не подсказываем, что именно неверно.
    if (!user || !matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.sign(user);
  }

  private sign(user: User) {
    return {
      access_token: this.jwt.sign({ sub: user.id, email: user.email }),
    };
  }
}
