import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, IsIn } from 'class-validator';

export class ExploreQueryDto {
  @ApiPropertyOptional({
    description: 'Virgülle ayrılmış etiket filtreleri (örn: "kedi,sınav")',
    example: 'kedi,sınav',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Sayfa numarası (1-tabanlı)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Sayfa başına kayıt sayısı (en fazla 100)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sıralama türü',
    enum: ['trending', 'latest', 'top'],
    default: 'trending',
  })
  @IsOptional()
  @IsIn(['trending', 'latest', 'top'])
  sort?: 'trending' | 'latest' | 'top' = 'trending';

  @ApiPropertyOptional({
    description: 'Belirli bir yükleyicinin adına göre filtreleme',
  })
  @IsOptional()
  @IsString()
  uploader?: string;
}
