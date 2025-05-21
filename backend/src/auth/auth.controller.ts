import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(body);
    if (response.success) {
      res.cookie('accessToken', response.accessToken, {
        httpOnly: true,
      });
    }
    return response;
  }

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.register(body);
    if (response.success) {
      res.cookie('accessToken', response.accessToken, {
        httpOnly: true,
      });
    }
    return response;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    return { success: true };
  }

  @Get('current')
  async current(@Req() req: Request) {
    try {
      const cookies = req.cookies;

      if (!cookies || !cookies.accessToken) {
        throw new UnauthorizedException('No access token found');
      }

      const accessToken = cookies.accessToken as string;
      const user = await this.authService.current(accessToken);
      const userWithoutPassword = {
        ...user,
        password: undefined,
      };

      return userWithoutPassword;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
