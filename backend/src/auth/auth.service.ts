import { LoginDto } from './dto/login.dto';
import {
  ConflictException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(body: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { username: body.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ userId: user.id });

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(body: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { username: body.username },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: body.username,
        password: hashedPassword,
      },
    });

    console.log(user);

    const accessToken = this.jwtService.sign({ userId: user.id });
    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
