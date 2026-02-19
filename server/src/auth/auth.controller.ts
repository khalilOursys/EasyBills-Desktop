import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { MailerService } from 'src/mailer/mailer.services';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    var idUser = req.user.userId;

    var user = this.usersService.findOne(idUser);
    return user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const user = await this.usersService.findByEmail(body.email);

    if (!user) {
      // Don't reveal if user doesn't exist for security
      return { message: 'If this email exists, a reset link has been sent' };
    }

    // Create a reset token (using JWT in this example)
    const resetToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: process.env.JWT_RESET_SECRET,
        expiresIn: '1h', // Token expires in 1 hour
      },
    );

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    await this.mailerService.sendPasswordResetEmail(
      user.email,
      resetLink,
      '1 heure',
    );

    return { message: 'If this email exists, a reset link has been sent' };
  }
}
