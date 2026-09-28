import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MemesService } from '../memes/memes.service';
import { MemeStatus } from '@prisma/client';

export interface SearchResponse {
  query: string;
  bestMatch: any;
  alternatives: any[];
  noExactMatch?: boolean;
}

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private memesService: MemesService,
  ) {}

  async search(query: string, currentUserId?: string): Promise<SearchResponse> {
    const cleanQuery = (query || '').trim().toLowerCase();

    // If query is empty, return top trending memes
    if (!cleanQuery) {
      const trendingMemes = await this.prisma.meme.findMany({
        where: { status: MemeStatus.ACTIVE },
        orderBy: [{ ratingCount: 'desc' }, { rating: 'desc' }],
        take: 5,
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
          ...(currentUserId
            ? {
                savedBy: { where: { userId: currentUserId } },
                ratings: { where: { userId: currentUserId } },
              }
            : {}),
        },
      });

      const formatted = trendingMemes.map((m) =>
        this.memesService.formatMeme(m, currentUserId),
      );

      return {
        query: 'Trend Memeler',
        bestMatch: formatted[0] || null,
        alternatives: formatted.slice(1, 5),
      };
    }

    // Search active memes matching title, tags, or uploader
    const matchedMemes = await this.prisma.meme.findMany({
      where: {
        status: MemeStatus.ACTIVE,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: cleanQuery, mode: 'insensitive' },
                },
              },
            },
          },
          {
            uploader: {
              OR: [
                { username: { contains: cleanQuery, mode: 'insensitive' } },
                { displayName: { contains: cleanQuery, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
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
        ...(currentUserId
          ? {
              savedBy: { where: { userId: currentUserId } },
              ratings: { where: { userId: currentUserId } },
            }
          : {}),
      },
    });

    if (matchedMemes.length > 0) {
      // Relevance scoring
      const scored = matchedMemes.map((meme) => {
        const titleLower = meme.title.toLowerCase();
        let score = 0;

        if (titleLower === cleanQuery) score += 100;
        else if (titleLower.startsWith(cleanQuery)) score += 50;
        else if (titleLower.includes(cleanQuery)) score += 30;

        const tagMatches = meme.tags.some(
          (t) => t.tag.name.toLowerCase() === cleanQuery,
        );
        if (tagMatches) score += 80;
        else if (
          meme.tags.some((t) => t.tag.name.toLowerCase().includes(cleanQuery))
        ) {
          score += 25;
        }

        if (
          meme.uploader.username.toLowerCase().includes(cleanQuery) ||
          meme.uploader.displayName.toLowerCase().includes(cleanQuery)
        ) {
          score += 15;
        }

        // Add rating and popularity bonus
        score += meme.rating * 4 + Math.min(meme.ratingCount, 50);

        return {
          meme,
          score,
        };
      });

      scored.sort((a, b) => b.score - a.score);

      const bestMatch = this.memesService.formatMeme(scored[0].meme, currentUserId);
      const otherMatches = scored
        .slice(1)
        .map((s) => this.memesService.formatMeme(s.meme, currentUserId));

      let alternatives = [...otherMatches];

      // If we have fewer than 4 alternatives, fill up with top trending memes
      if (alternatives.length < 4) {
        const excludedIds = [bestMatch.id, ...alternatives.map((a) => a.id)];
        const fillers = await this.prisma.meme.findMany({
          where: {
            status: MemeStatus.ACTIVE,
            id: { notIn: excludedIds },
          },
          orderBy: [{ ratingCount: 'desc' }, { rating: 'desc' }],
          take: 4 - alternatives.length,
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
            ...(currentUserId
              ? {
                  savedBy: { where: { userId: currentUserId } },
                  ratings: { where: { userId: currentUserId } },
                }
              : {}),
          },
        });

        alternatives = [
          ...alternatives,
          ...fillers.map((f) => this.memesService.formatMeme(f, currentUserId)),
        ];
      }

      return {
        query,
        bestMatch,
        alternatives: alternatives.slice(0, 4),
      };
    }

    // Fallback if no exact match: get top trending memes
    const trending = await this.prisma.meme.findMany({
      where: { status: MemeStatus.ACTIVE },
      orderBy: [{ ratingCount: 'desc' }, { rating: 'desc' }],
      take: 5,
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
        ...(currentUserId
          ? {
              savedBy: { where: { userId: currentUserId } },
              ratings: { where: { userId: currentUserId } },
            }
          : {}),
      },
    });

    const formattedTrending = trending.map((m) =>
      this.memesService.formatMeme(m, currentUserId),
    );

    return {
      query,
      noExactMatch: true,
      bestMatch: formattedTrending[0] || null,
      alternatives: formattedTrending.slice(1, 5),
    };
  }
}
