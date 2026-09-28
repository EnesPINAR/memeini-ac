import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MemesService } from '../memes/memes.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MemeStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private memesService: MemesService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            memes: { where: { status: { not: MemeStatus.DELETED } } },
            ratings: true,
            savedMemes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      ...user,
      stats: {
        uploadedCount: user._count.memes,
        starredCount: user._count.ratings,
        savedCount: user._count.savedMemes,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName?.trim(),
        bio: dto.bio?.trim(),
        avatarEmoji: dto.avatarEmoji,
        avatarBg: dto.avatarBg,
        notificationsEnabled: dto.notificationsEnabled,
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
      },
    });

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const matches = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException('Mevcut şifreniz hatalı');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Şifreniz başarıyla güncellendi' };
  }

  async getUploadedMemes(userId: string) {
    const memes = await this.prisma.meme.findMany({
      where: {
        uploaderId: userId,
        status: { not: MemeStatus.DELETED }, // Show ACTIVE and PENDING_DELETE
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarEmoji: true,
            avatarBg: true,
          },
        },
        savedBy: { where: { userId } },
        ratings: { where: { userId } },
      },
    });

    return memes.map((m) => {
      const formatted = this.memesService.formatMeme(m, userId);
      return {
        ...formatted,
        isPendingDelete: m.status === MemeStatus.PENDING_DELETE,
      };
    });
  }

  async getStarredMemes(userId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: {
        userId,
        meme: { status: MemeStatus.ACTIVE },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        meme: {
          include: {
            tags: { include: { tag: true } },
            uploader: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarEmoji: true,
                avatarBg: true,
              },
            },
            savedBy: { where: { userId } },
            ratings: { where: { userId } },
          },
        },
      },
    });

    return ratings.map((r) => {
      const formatted = this.memesService.formatMeme(r.meme, userId);
      return {
        ...formatted,
        userScore: r.score, // specific star score given by the user
      };
    });
  }

  async getSavedMemes(userId: string) {
    const saved = await this.prisma.savedMeme.findMany({
      where: {
        userId,
        meme: { status: MemeStatus.ACTIVE },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        meme: {
          include: {
            tags: { include: { tag: true } },
            uploader: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarEmoji: true,
                avatarBg: true,
              },
            },
            savedBy: { where: { userId } },
            ratings: { where: { userId } },
          },
        },
      },
    });

    return saved.map((s) => {
      const formatted = this.memesService.formatMeme(s.meme, userId);
      return {
        ...formatted,
        savedAt: s.createdAt,
      };
    });
  }

  async getPublicProfile(username: string) {
    const cleanUsername = username.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarEmoji: true,
        avatarBg: true,
        createdAt: true,
        _count: {
          select: {
            memes: { where: { status: MemeStatus.ACTIVE } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      ...user,
      stats: {
        uploadedCount: user._count.memes,
      },
    };
  }
}
