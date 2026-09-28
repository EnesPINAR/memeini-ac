import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MemeStatus } from '@prisma/client';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async saveMeme(userId: string, memeId: string) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: memeId },
    });

    if (!meme || meme.status === MemeStatus.DELETED) {
      throw new NotFoundException('Meme bulunamadı veya silinmiş');
    }

    await this.prisma.savedMeme.upsert({
      where: {
        userId_memeId: {
          userId,
          memeId,
        },
      },
      create: {
        userId,
        memeId,
      },
      update: {},
    });

    return { isSaved: true, message: 'Meme kaydedilenlere eklendi' };
  }

  async unsaveMeme(userId: string, memeId: string) {
    await this.prisma.savedMeme.deleteMany({
      where: {
        userId,
        memeId,
      },
    });

    return { isSaved: false, message: 'Meme kaydedilenlerden çıkarıldı' };
  }

  async toggleSave(userId: string, memeId: string) {
    const existing = await this.prisma.savedMeme.findUnique({
      where: {
        userId_memeId: {
          userId,
          memeId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedMeme.delete({
        where: {
          userId_memeId: {
            userId,
            memeId,
          },
        },
      });
      return { isSaved: false, message: 'Meme kaydedilenlerden çıkarıldı' };
    } else {
      const meme = await this.prisma.meme.findUnique({
        where: { id: memeId },
      });

      if (!meme || meme.status === MemeStatus.DELETED) {
        throw new NotFoundException('Meme bulunamadı veya silinmiş');
      }

      await this.prisma.savedMeme.create({
        data: {
          userId,
          memeId,
        },
      });
      return { isSaved: true, message: 'Meme kaydedilenlere eklendi' };
    }
  }
}
