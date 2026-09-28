import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MemesService } from './memes.service';
import { CreateMemeDto } from './dto/create-meme.dto';
import { ExploreQueryDto } from './dto/explore-query.dto';
import { SuggestTagDto } from './dto/suggest-tag.dto';
import { MemeDeleteRequestDto } from './dto/delete-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Memes')
@Controller('api/memes')
export class MemesController {
  constructor(private readonly memesService: MemesService) {}

  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Pinterest tarzı keşfet akışı (Çoklu etiket ve sayfalama destekli)',
  })
  @ApiResponse({ status: 200, description: 'Filtrelenmiş ve sayfalanmış memeler' })
  async getExplore(
    @Query() query: ExploreQueryDto,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.memesService.getExplore(query, currentUserId);
  }

  @Get('random')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Zar butonu için rastgele 1 aktif meme getirir',
  })
  @ApiResponse({ status: 200, description: 'Rastgele seçilen meme' })
  async getRandom(@CurrentUser('id') currentUserId?: string) {
    return this.memesService.getRandom(currentUserId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Meme detayını getirir' })
  @ApiResponse({ status: 200, description: 'Meme detayı' })
  @ApiResponse({ status: 404, description: 'Meme bulunamadı' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.memesService.getById(id, currentUserId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Yeni meme yükle (Görsel veya Video)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'tags'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Pazartesi Sabahı Alarm Çalınca' },
        tags: { type: 'string', example: 'pazartesi,alarm,uyku,komik' },
        aspectRatio: { type: 'number', example: 0.77 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Meme başarıyla yüklendi' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMemeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.memesService.create(file, dto, userId);
  }

  @Post(':id/suggest-tag')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Meme için yeni bir etiket öner (Admin onayına gider)' })
  @ApiResponse({ status: 201, description: 'Etiket önerisi kuyruğa alındı' })
  @ApiResponse({ status: 409, description: 'Etiket zaten mevcut veya önerilmiş' })
  async suggestTag(
    @Param('id', ParseUUIDPipe) memeId: string,
    @Body() dto: SuggestTagDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.memesService.suggestTag(memeId, dto, userId);
  }

  @Post(':id/delete-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kullanıcının kendi memeini silme talebi oluşturması (İki aşamalı onay)',
  })
  @ApiResponse({ status: 201, description: 'Silme talebi oluşturuldu ve meme beklemeye alındı' })
  @ApiResponse({ status: 403, description: 'Sadece yükleyici talepte bulunabilir' })
  async createDeleteRequest(
    @Param('id', ParseUUIDPipe) memeId: string,
    @Body() dto: MemeDeleteRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.memesService.createDeleteRequest(memeId, dto, userId);
  }
}
