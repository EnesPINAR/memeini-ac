import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Yapay zekamsı meme arama (bestMatch + 4 alternatifler + noExactMatch)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Arama terimi (başlık, etiket veya kullanıcı adı)',
    example: 'yazılımcı',
  })
  @ApiResponse({
    status: 200,
    description: 'Arama sonucu (bestMatch, alternatives, noExactMatch)',
  })
  async search(
    @Query('q') query: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.searchService.search(query, currentUserId);
  }
}
