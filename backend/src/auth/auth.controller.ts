import { Body, Controller, HttpCode, Post, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserType } from '../common/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';

const Public = () => SetMetadata('isPublic', true);

const COOKIE_OPTIONS = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
});

@Controller('auth')
export class AuthController {
  private readonly isProd: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  @Public()
  @Post('control/login')
  @HttpCode(200)
  async loginControl(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginControl(
      dto.email, dto.password, req.ip ?? '', req.headers['user-agent'] ?? '',
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return res.json({ message: 'Login successful.' });
  }

  @Public()
  @Post('customer/login')
  @HttpCode(200)
  async loginCustomer(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginCustomer(
      dto.email, dto.password, req.ip ?? '', req.headers['user-agent'] ?? '',
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return res.json({ message: 'Login successful.' });
  }

  @Public()
  @Post('delivery/login')
  @HttpCode(200)
  async loginDelivery(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginDelivery(
      dto.email, dto.password, req.ip ?? '', req.headers['user-agent'] ?? '',
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return res.json({ message: 'Login successful.' });
  }

  @Public()
  @Post('store/login')
  @HttpCode(200)
  async loginStore(@Body() dto: LoginDto, @Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginStore(
      dto.email, dto.password, req.ip ?? '', req.headers['user-agent'] ?? '',
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return res.json({ message: 'Login successful.' });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      this.clearTokenCookies(res);
      return res.status(401).json({ message: 'No refresh token.' });
    }
    try {
      const tokens = await this.authService.refreshTokens(
        refreshToken, req.ip ?? '', req.headers['user-agent'] ?? '',
      );
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
      return res.json({ message: 'Token refreshed.' });
    } catch {
      // Clear stale cookies so the browser stops sending them on every request.
      // Without this, expired/revoked tokens cause an infinite redirect loop.
      this.clearTokenCookies(res);
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser('sub') userId: string, @Res() res: Response) {
    await this.authService.logout(userId);
    res.clearCookie('access_token', COOKIE_OPTIONS(this.isProd));
    res.clearCookie('refresh_token', COOKIE_OPTIONS(this.isProd));
    return res.json({ message: 'Logged out.' });
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.sub, user.userType as UserType, dto.currentPassword, dto.newPassword,
    );
    return { message: 'Password changed.' };
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token', COOKIE_OPTIONS(this.isProd));
    res.clearCookie('refresh_token', COOKIE_OPTIONS(this.isProd));
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS(this.isProd),
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS(this.isProd),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
