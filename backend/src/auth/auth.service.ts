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

    const accessToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: '1h',
      },
    );

    return {
      success: true,
      accessToken,
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

    const accessToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: '1h',
      },
    );

    return {
      success: true,
      accessToken,
    };
  }
  async current(accessToken: string) {
    try {
      // Vérifier et décoder le token

      const decoded = this.jwtService.verify(accessToken);

      if (!decoded || !decoded.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Récupérer l'utilisateur de la base de données
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      // Gérer spécifiquement les erreurs de JWT
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (error instanceof UnauthorizedException) {
        // Relancer les exceptions d'autorisation déjà créées
        throw error;
      } else {
        // Pour toute autre erreur inattendue
        console.error('Error verifying token:', error);
        throw new UnauthorizedException('Authentication failed');
      }
    }
  }
}
