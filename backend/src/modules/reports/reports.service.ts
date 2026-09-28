import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateReportDto) {
    const meme = await this.prisma.meme.findUnique({
      where: { id: dto.memeId },
    });

    if (!meme) {
      throw new NotFoundException('Şikayet edilmek istenen meme bulunamadı');
    }

    const report = await this.prisma.report.create({
      data: {
        memeId: dto.memeId,
        reporterId: userId,
        reason: dto.reason.trim(),
        description: dto.description?.trim(),
        status: ReportStatus.PENDING,
      },
    });

    return {
      message: 'Şikayetiniz alındı, moderasyon ekibimiz inceleyecektir',
      reportId: report.id,
    };
  }
}
