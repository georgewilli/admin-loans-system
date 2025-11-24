import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { AuditEventType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) { }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Log failed login attempt - user not found
      await this.auditService.logAuthEvent({
        eventType: AuditEventType.LOGIN_FAILED,
        userEmail: email,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'User not found',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      // Log failed login attempt - wrong password
      await this.auditService.logAuthEvent({
        eventType: AuditEventType.LOGIN_FAILED,
        userEmail: email,
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid password',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Log successful login
    await this.auditService.logAuthEvent({
      eventType: AuditEventType.LOGIN_SUCCESS,
      userEmail: user.email,
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
      metadata: { role: user.role },
    });

    return {
      access_token: token,
    };
  }
}
