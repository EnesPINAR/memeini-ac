import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { RateMemeDto } from './dto/rate-meme.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Ratings')
@Controller('api/memes/:id')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Meme için 1-5 yıldız puanı ver (Transaction ile ortalama güncellenir)',
  })
  @ApiResponse({ status: 200, description: 'Puan kaydedildi ve meme ortalaması güncellendi' })
  async rateMeme(
    @Param('id', ParseUUIDPipe) memeId: string,
    @Body() dto: RateMemeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ratingsService.rateMeme(memeId, userId, dto);
  }

  @Get('my-rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının bu meme için verdiği puanı getirir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı puanı' })
  async getMyRating(
    @Param('id', ParseUUIDPipe) memeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ratingsService.getUserRating(memeId, userId);
  }
}
