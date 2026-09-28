import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  RequestStatus,
  MemeStatus,
  ReportStatus,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  // ==================== DELETE REQUESTS ====================

  async getDeleteRequests(status: RequestStatus = RequestStatus.PENDING) {
    return this.prisma.memeDeleteRequest.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        meme: {
          select: {
            id: true,
            title: true,
            mediaUrl: true,
            aspectRatio: true,
            status: true,
            rating: true,
            ratingCount: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async approveDeleteRequest(requestId: string) {
    const request = await this.prisma.memeDeleteRequest.findUnique({
      where: { id: requestId },
      include: { meme: true },
    });

    if (!request) {
      throw new NotFoundException('Silme talebi bulunamadı');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Bu talep zaten işlenmiş');
    }

    // Process approval
    await this.prisma.$transaction(async (tx) => {
      // 1. Update request status to APPROVED
      await tx.memeDeleteRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.APPROVED },
      });

      // 2. Mark meme as DELETED
      await tx.meme.update({
        where: { id: request.memeId },
        data: { status: MemeStatus.DELETED },
      });
    });

    // 3. Remove physical media file from storage
    if (request.meme.mediaUrl) {
      await this.storageService.deleteFile(request.meme.mediaUrl);
    }

    return {
      message: 'Silme talebi onaylandı, meme yayından kaldırıldı ve medya silindi',
    };
  }

  async rejectDeleteRequest(requestId: string, note?: string) {
    const request = await this.prisma.memeDeleteRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Silme talebi bulunamadı');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Bu talep zaten işlenmiş');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.memeDeleteRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          note: note ? note : request.note,
        },
      });

      // Revert meme status back to ACTIVE
      await tx.meme.update({
        where: { id: request.memeId },
        data: { status: MemeStatus.ACTIVE },
      });
    });

    return {
      message: 'Silme talebi reddedildi, meme aktif duruma geri getirildi',
    };
  }

  // ==================== SUGGESTED TAGS ====================

  async getSuggestedTags(status: RequestStatus = RequestStatus.PENDING) {
    return this.prisma.suggestedTag.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: {
        meme: {
          select: {
            id: true,
            title: true,
            mediaUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async approveSuggestedTag(suggestionId: string) {
    const suggestion = await this.prisma.suggestedTag.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Etiket önerisi bulunamadı');
    }

    if (suggestion.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Bu etiket önerisi zaten işlenmiş');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Ensure tag exists in Tag table
      const tag = await tx.tag.upsert({
        where: { name: suggestion.tagName },
        update: {},
        create: { name: suggestion.tagName },
      });

      // 2. Associate tag with meme
      await tx.memeTag.upsert({
        where: {
          memeId_tagId: {
            memeId: suggestion.memeId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          memeId: suggestion.memeId,
          tagId: tag.id,
        },
      });

      // 3. Update suggestion status to APPROVED
      await tx.suggestedTag.update({
        where: { id: suggestionId },
        data: { status: RequestStatus.APPROVED },
      });
    });

    return {
      message: `"${suggestion.tagName}" etiketi onaylandı ve meme'e başarıyla eklendi`,
    };
  }

  async rejectSuggestedTag(suggestionId: string) {
    const suggestion = await this.prisma.suggestedTag.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Etiket önerisi bulunamadı');
    }

    if (suggestion.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Bu etiket önerisi zaten işlenmiş');
    }

    await this.prisma.suggestedTag.update({
      where: { id: suggestionId },
      data: { status: RequestStatus.REJECTED },
    });

    return { message: 'Etiket önerisi reddedildi' };
  }

  // ==================== REPORTS ====================

  async getReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        meme: {
          select: {
            id: true,
            title: true,
            mediaUrl: true,
            status: true,
          },
        },
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    dismissReason?: string,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    const updatedDescription = dismissReason
      ? `${report.description ? report.description + ' | ' : ''}[Geçersiz Sayılma Sebebi: ${dismissReason}]`
      : report.description;

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        description: updatedDescription,
      },
    });

    return {
      message: `Şikayet durumu "${status}" olarak güncellendi`,
      report: updated,
    };
  }

  // ==================== EDIT MEME (ADMIN) ====================

  async updateMeme(memeId: string, dto: { title?: string; tags?: string[] }) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: memeId },
      include: { tags: { include: { tag: true } } },
    });

    if (!meme) {
      throw new NotFoundException('Meme bulunamadı');
    }

    if (dto.title && dto.title.trim()) {
      await this.prisma.meme.update({
        where: { id: memeId },
        data: { title: dto.title.trim() },
      });
    }

    if (dto.tags && Array.isArray(dto.tags)) {
      await this.prisma.memeTag.deleteMany({
        where: { memeId },
      });

      for (const tagName of dto.tags) {
        const clean = tagName.trim().replace(/^#+/, '').toLowerCase();
        if (!clean) continue;
        const tag = await this.prisma.tag.upsert({
          where: { name: clean },
          create: { name: clean },
          update: {},
        });
        await this.prisma.memeTag.create({
          data: {
            memeId,
            tagId: tag.id,
          },
        });
      }
    }

    return this.prisma.meme.findUnique({
      where: { id: memeId },
      include: {
        tags: { include: { tag: true } },
        uploader: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });
  }

  // ==================== ADMIN STATS ====================

  async getStats() {
    const [
      totalUsers,
      totalMemes,
      pendingDeleteRequests,
      pendingSuggestedTags,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.meme.count({ where: { status: MemeStatus.ACTIVE } }),
      this.prisma.memeDeleteRequest.count({
        where: { status: RequestStatus.PENDING },
      }),
      this.prisma.suggestedTag.count({
        where: { status: RequestStatus.PENDING },
      }),
      this.prisma.report.count({
        where: { status: ReportStatus.PENDING },
      }),
    ]);

    return {
      totalUsers,
      totalActiveMemes: totalMemes,
      pendingQueues: {
        deleteRequests: pendingDeleteRequests,
        suggestedTags: pendingSuggestedTags,
        reports: pendingReports,
      },
    };
  }

  // ==================== ADMIN HISTORY ====================

  async getHistory() {
    const [deletedMemes, addedTags, reportsHistory, approvedMemes] = await Promise.all([
      this.prisma.memeDeleteRequest.findMany({
        where: { status: RequestStatus.APPROVED },
        orderBy: { updatedAt: 'desc' },
        include: {
          meme: {
            select: {
              id: true,
              title: true,
              mediaUrl: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.suggestedTag.findMany({
        where: { status: RequestStatus.APPROVED },
        orderBy: { updatedAt: 'desc' },
        include: {
          meme: {
            select: {
              id: true,
              title: true,
              mediaUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.report.findMany({
        where: {
          status: { in: [ReportStatus.RESOLVED, ReportStatus.DISMISSED] },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          meme: {
            select: {
              id: true,
              title: true,
              mediaUrl: true,
            },
          },
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.meme.findMany({
        where: { status: MemeStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
    ]);

    return {
      deletedMemes,
      addedTags,
      reportsHistory,
      approvedMemes: approvedMemes.map((m) => ({
        id: m.id,
        title: m.title,
        mediaUrl: m.mediaUrl,
        uploader: m.uploader,
        approvedAt: m.createdAt,
        tags: m.tags.map((t) => t.tag.name),
      })),
    };
  }
}
