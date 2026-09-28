import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Collections')
@Controller('api/collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post('save/:memeId')
  @ApiOperation({ summary: 'Meme kaydet (Koleksiyona ekle)' })
  @ApiResponse({ status: 200, description: 'Meme kaydedildi' })
  async save(
    @Param('memeId', ParseUUIDPipe) memeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collectionsService.saveMeme(userId, memeId);
  }

  @Delete('save/:memeId')
  @ApiOperation({ summary: 'Kaydedilen memeyi koleksiyondan çıkar' })
  @ApiResponse({ status: 200, description: 'Meme koleksiyondan çıkarıldı' })
  async unsave(
    @Param('memeId', ParseUUIDPipe) memeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collectionsService.unsaveMeme(userId, memeId);
  }

  @Post('toggle/:memeId')
  @ApiOperation({ summary: 'Meme kaydetme durumunu tersine çevir (Toggle)' })
  @ApiResponse({ status: 200, description: 'Durum güncellendi' })
  async toggle(
    @Param('memeId', ParseUUIDPipe) memeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.collectionsService.toggleSave(userId, memeId);
  }
}
