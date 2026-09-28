import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, RequestStatus, ReportStatus } from '@prisma/client';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin genel istatistikleri ve kuyruk sayıları' })
  @ApiResponse({ status: 200, description: 'İstatistikler' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('history')
  @ApiOperation({ summary: 'Admin işlem geçmişi (onaylanan, silinen, eklenen etiketler, raporlar)' })
  @ApiResponse({ status: 200, description: 'İşlem geçmişi' })
  async getHistory() {
    return this.adminService.getHistory();
  }

  // ==================== DELETE REQUESTS ====================

  @Get('delete-requests')
  @ApiOperation({ summary: 'Silme talepleri onay kuyruğunu listele' })
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false })
  async getDeleteRequests(@Query('status') status?: RequestStatus) {
    return this.adminService.getDeleteRequests(status);
  }

  @Post('delete-requests/:id/approve')
  @ApiOperation({
    summary: 'Meme silme talebini onayla (Meme DELETED olur, medya depolamadan silinir)',
  })
  @ApiResponse({ status: 200, description: 'Silme talebi onaylandı' })
  async approveDeleteRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveDeleteRequest(id);
  }

  @Post('delete-requests/:id/reject')
  @ApiOperation({
    summary: 'Meme silme talebini reddet (Meme tekrar ACTIVE olur)',
  })
  @ApiResponse({ status: 200, description: 'Silme talebi reddedildi' })
  async rejectDeleteRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note?: string,
  ) {
    return this.adminService.rejectDeleteRequest(id, note);
  }

  // ==================== SUGGESTED TAGS ====================

  @Get('suggested-tags')
  @ApiOperation({ summary: 'Önerilen etiketler onay kuyruğunu listele' })
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false })
  async getSuggestedTags(@Query('status') status?: RequestStatus) {
    return this.adminService.getSuggestedTags(status);
  }

  @Post('suggested-tags/:id/approve')
  @ApiOperation({
    summary: 'Önerilen etiketi onayla (Tag oluşturulur ve meme ile ilişkilendirilir)',
  })
  @ApiResponse({ status: 200, description: 'Etiket onaylandı' })
  async approveSuggestedTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveSuggestedTag(id);
  }

  @Post('suggested-tags/:id/reject')
  @ApiOperation({ summary: 'Önerilen etiketi reddet' })
  @ApiResponse({ status: 200, description: 'Etiket reddedildi' })
  async rejectSuggestedTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectSuggestedTag(id);
  }

  // ==================== REPORTS ====================

  @Get('reports')
  @ApiOperation({ summary: 'Kullanıcı şikayetlerini listele' })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  async getReports(@Query('status') status?: ReportStatus) {
    return this.adminService.getReports(status);
  }

  @Patch('reports/:id/status')
  @ApiOperation({ summary: 'Şikayet durumunu güncelle (RESOLVED, DISMISSED)' })
  @ApiResponse({ status: 200, description: 'Şikayet durumu güncellendi' })
  async updateReportStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ReportStatus,
    @Body('dismissReason') dismissReason?: string,
  ) {
    return this.adminService.updateReportStatus(id, status, dismissReason);
  }

  // ==================== EDIT MEME ====================

  @Patch('memes/:id')
  @ApiOperation({ summary: 'Admin meme başlık ve etiketlerini düzenle' })
  @ApiResponse({ status: 200, description: 'Meme güncellendi' })
  async updateMeme(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { title?: string; tags?: string[] },
  ) {
    return this.adminService.updateMeme(id, dto);
  }
}
