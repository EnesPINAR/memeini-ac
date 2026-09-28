import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  @ApiResponse({ status: 201, description: 'Kullanıcı oluşturuldu ve tokenler üretildi' })
  @ApiResponse({ status: 409, description: 'E-posta veya kullanıcı adı zaten kullanımda' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı girişi (E-posta veya Kullanıcı adı)' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı, access ve refresh token döndürülür' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token ile yeni Access Token alma (Token Rotation)' })
  @ApiResponse({ status: 200, description: 'Yeni token çifti üretildi' })
  @ApiResponse({ status: 401, description: 'Geçersiz veya süresi dolmuş refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturumu kapatma ve refresh tokeni geçersiz kılma' })
  @ApiResponse({ status: 200, description: 'Çıkış başarılı' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Giriş yapan kullanıcının kendi profil bilgilerini getirir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı profili' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
