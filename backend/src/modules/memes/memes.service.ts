import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateMemeDto } from './dto/create-meme.dto';
import { ExploreQueryDto } from './dto/explore-query.dto';
import { SuggestTagDto } from './dto/suggest-tag.dto';
import { MemeDeleteRequestDto } from './dto/delete-request.dto';
import { MemeStatus, RequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class MemesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async create(file: Express.Multer.File, dto: CreateMemeDto, userId: string) {
    if (!file) {
      throw new BadRequestException('Lütfen bir görsel veya video dosyası yükleyin');
    }

    const uploadResult = await this.storageService.uploadFile(file);

    // Parse and sanitize tags
    const tagNames = (Array.isArray(dto.tags) ? dto.tags.join(',') : dto.tags)
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (tagNames.length === 0) {
      throw new BadRequestException('En az bir geçerli etiket girmelisiniz');
    }

    // Unique tags
    const uniqueTags = Array.from(new Set(tagNames));

    const aspectRatio = dto.aspectRatio
      ? Number(dto.aspectRatio)
      : uploadResult.aspectRatio;

    // Use Prisma transaction to create meme and ensure tags exist
    const meme = await this.prisma.$transaction(async (tx) => {
      // Find or create tags
      const tagRecords = await Promise.all(
        uniqueTags.map(async (name) => {
          return tx.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          });
        }),
      );

      // Create Meme
      const newMeme = await tx.meme.create({
        data: {
          title: dto.title.trim(),
          mediaUrl: uploadResult.url,
          mediaType: uploadResult.mediaType,
          aspectRatio,
          uploaderId: userId,
          status: MemeStatus.ACTIVE,
          tags: {
            create: tagRecords.map((t) => ({
              tagId: t.id,
            })),
          },
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
        },
      });

      return newMeme;
    });

    return this.formatMeme(meme);
  }

  async getExplore(query: ExploreQueryDto, currentUserId?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MemeWhereInput = {
      status: MemeStatus.ACTIVE,
    };

    // Filter by tags
    if (query.tags) {
      const filterTags = query.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      if (filterTags.length > 0) {
        where.tags = {
          some: {
            tag: {
              name: { in: filterTags },
            },
          },
        };
      }
    }

    // Filter by uploader
    if (query.uploader) {
      where.uploader = {
        username: query.uploader.trim().toLowerCase(),
      };
    }

    // Sorting
    let orderBy: Prisma.MemeOrderByWithRelationInput[] = [];
    switch (query.sort) {
      case 'latest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'top':
        orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }];
        break;
      case 'trending':
      default:
        orderBy = [{ ratingCount: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const [memes, total] = await Promise.all([
      this.prisma.meme.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
      this.prisma.meme.count({ where }),
    ]);

    const formattedMemes = memes.map((m) => this.formatMeme(m, currentUserId));

    return {
      data: formattedMemes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    };
  }

  async getRandom(currentUserId?: string) {
    const activeCount = await this.prisma.meme.count({
      where: { status: MemeStatus.ACTIVE },
    });

    if (activeCount === 0) {
      throw new NotFoundException('Henüz görüntülenebilecek aktif meme bulunmuyor');
    }

    const randomOffset = Math.floor(Math.random() * activeCount);

    const [randomMeme] = await this.prisma.meme.findMany({
      where: { status: MemeStatus.ACTIVE },
      skip: randomOffset,
      take: 1,
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

    return this.formatMeme(randomMeme, currentUserId);
  }

  async getById(id: string, currentUserId?: string) {
    const meme = await this.prisma.meme.findUnique({
      where: { id },
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

    if (!meme) {
      throw new NotFoundException('Meme bulunamadı');
    }

    // Only allow viewing inactive memes if user is the uploader
    if (meme.status === MemeStatus.DELETED) {
      throw new NotFoundException('Bu meme silinmiştir');
    }

    if (meme.status === MemeStatus.PENDING_DELETE && meme.uploaderId !== currentUserId) {
      // Still allow viewing or inform
    }

    return this.formatMeme(meme, currentUserId);
  }

  async suggestTag(memeId: string, dto: SuggestTagDto, userId: string) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: memeId },
      include: { tags: { include: { tag: true } } },
    });

    if (!meme || meme.status !== MemeStatus.ACTIVE) {
      throw new NotFoundException('Meme bulunamadı veya aktif değil');
    }

    const cleanTagName = dto.tagName.trim().toLowerCase();

    // Check if tag already exists on meme
    const existsOnMeme = meme.tags.some((mt) => mt.tag.name === cleanTagName);
    if (existsOnMeme) {
      throw new ConflictException('Bu etiket zaten bu meme üzerinde bulunuyor');
    }

    // Check if already suggested and pending
    const existingPending = await this.prisma.suggestedTag.findFirst({
      where: {
        memeId,
        tagName: cleanTagName,
        status: RequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException('Bu etiket zaten onay kuyruğunda bekliyor');
    }

    const suggestion = await this.prisma.suggestedTag.create({
      data: {
        memeId,
        userId,
        tagName: cleanTagName,
        status: RequestStatus.PENDING,
      },
    });

    return {
      message: 'Etiket öneriniz yönetici onayına gönderildi',
      suggestion,
    };
  }

  async createDeleteRequest(memeId: string, dto: MemeDeleteRequestDto, userId: string) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: memeId },
    });

    if (!meme) {
      throw new NotFoundException('Meme bulunamadı');
    }

    if (meme.uploaderId !== userId) {
      throw new ForbiddenException('Sadece kendi yüklediğiniz memeler için silme talebi oluşturabilirsiniz');
    }

    if (meme.status === MemeStatus.PENDING_DELETE) {
      throw new ConflictException('Bu meme için zaten bekleyen bir silme talebi mevcut');
    }

    if (meme.status === MemeStatus.DELETED) {
      throw new BadRequestException('Bu meme zaten silinmiş');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const deleteRequest = await tx.memeDeleteRequest.create({
        data: {
          memeId,
          userId,
          reason: dto.reason.trim(),
          note: dto.note?.trim(),
          status: RequestStatus.PENDING,
        },
      });

      await tx.meme.update({
        where: { id: memeId },
        data: { status: MemeStatus.PENDING_DELETE },
      });

      return deleteRequest;
    });

    return {
      message: 'Silme talebiniz alındı ve meme onay beklemeye alındı',
      deleteRequest: result,
    };
  }

  formatMeme(meme: any, currentUserId?: string) {
    const tags = meme.tags?.map((t: any) => t.tag ? t.tag.name : t.name) || [];
    const isSaved = meme.savedBy ? meme.savedBy.length > 0 : false;
    const userRating = meme.ratings && meme.ratings.length > 0 ? meme.ratings[0].score : null;

    return {
      id: meme.id,
      title: meme.title,
      mediaUrl: meme.mediaUrl,
      imageUrl: meme.mediaUrl, // Mobile backward compatibility alias
      mediaType: meme.mediaType?.toLowerCase() || 'image',
      aspectRatio: meme.aspectRatio || 1.0,
      tags,
      uploaderId: meme.uploaderId,
      uploaderNickname: meme.uploader?.username || 'anonim',
      uploaderDisplayName: meme.uploader?.displayName || 'Anonim',
      uploaderAvatar: meme.uploader?.avatarEmoji || '🐹',
      uploaderBg: meme.uploader?.avatarBg || '#FFE600',
      rating: Number(meme.rating?.toFixed(1) || 0),
      ratingCount: meme.ratingCount || 0,
      status: meme.status,
      createdAt: meme.createdAt,
      isSaved,
      userRating,
    };
  }
}
