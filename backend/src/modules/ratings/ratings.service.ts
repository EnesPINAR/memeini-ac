import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RateMemeDto } from './dto/rate-meme.dto';
import { MemeStatus } from '@prisma/client';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async rateMeme(memeId: string, userId: string, dto: RateMemeDto) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: memeId },
    });

    if (!meme || meme.status !== MemeStatus.ACTIVE) {
      throw new NotFoundException('Meme bulunamadı veya oylamaya açık değil');
    }

    // Execute atomic update in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert user's rating
      const rating = await tx.rating.upsert({
        where: {
          userId_memeId: {
            userId,
            memeId,
          },
        },
        create: {
          userId,
          memeId,
          score: dto.score,
        },
        update: {
          score: dto.score,
        },
      });

      // 2. Aggregate all ratings for this meme
      const aggregation = await tx.rating.aggregate({
        where: { memeId },
        _avg: { score: true },
        _count: { score: true },
      });

      const avgScore = aggregation._avg.score
        ? parseFloat(aggregation._avg.score.toFixed(1))
        : 0;
      const count = aggregation._count.score || 0;

      // 3. Update meme table with new rating and ratingCount
      const updatedMeme = await tx.meme.update({
        where: { id: memeId },
        data: {
          rating: avgScore,
          ratingCount: count,
        },
      });

      return {
        memeId,
        userScore: rating.score,
        rating: updatedMeme.rating,
        ratingCount: updatedMeme.ratingCount,
      };
    });

    return {
      message: 'Puanınız başarıyla kaydedildi',
      ...result,
    };
  }

  async getUserRating(memeId: string, userId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: {
        userId_memeId: {
          userId,
          memeId,
        },
      },
    });

    return {
      memeId,
      score: rating ? rating.score : null,
    };
  }
}
