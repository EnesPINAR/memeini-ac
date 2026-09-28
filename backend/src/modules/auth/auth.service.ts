import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedUsername = dto.username.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
      }
      if (existing.username === normalizedUsername) {
        throw new ConflictException('Bu kullanıcı adı zaten alınmış');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        displayName: dto.displayName.trim(),
        bio: dto.bio ?? 'Her duruma uygun bir meme mutlaka vardır 🎯',
        avatarEmoji: dto.avatarEmoji ?? '🐹',
        avatarBg: dto.avatarBg ?? '#FFE600',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarEmoji: true,
        avatarBg: true,
        role: true,
        notificationsEnabled: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...userProfile } = user;

    return {
      user: userProfile,
      tokens,
    };
  }

  async refreshTokens(dto: RefreshDto) {
    const refreshSecret = this.configService.get<string>(
      'jwt.refreshSecret',
      'default_jwt_refresh_secret_memeini_2026',
    );

    let payload: any;
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Erişim reddedildi. Lütfen tekrar giriş yapın');
    }

    const refreshTokenMatches = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Geçersiz refresh token (kullanılmış veya iptal edilmiş)');
    }

    // Token Rotation: issue brand new access & refresh tokens
    const tokens = await this.generateTokens(user.id, user.username, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, refreshTokenHash: { not: null } },
      data: { refreshTokenHash: null },
    });
    return { message: 'Başarıyla çıkış yapıldı' };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private async generateTokens(userId: string, username: string, role: string) {
    const accessSecret = this.configService.get<string>(
      'jwt.accessSecret',
      'default_jwt_access_secret_memeini_2026',
    );
    const accessExpiration = this.configService.get<string>(
      'jwt.accessExpiration',
      '15m',
    );
    const refreshSecret = this.configService.get<string>(
      'jwt.refreshSecret',
      'default_jwt_refresh_secret_memeini_2026',
    );
    const refreshExpiration = this.configService.get<string>(
      'jwt.refreshExpiration',
      '30d',
    );

    const payload = { sub: userId, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiration as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiration,
    };
  }
}
