import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  login(@Body() dto: { email: string; password: string }, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return this.authService.login(dto.email, dto.password, ipAddress, userAgent);
  }
}
