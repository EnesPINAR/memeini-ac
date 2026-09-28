import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MemeDeleteRequestDto {
  @ApiProperty({
    example: 'Yanlış görsel veya hatalı etiket yükledim',
    description: 'Silme talebi gerekçesi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Lütfen silme nedeni belirtin' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Daha kaliteli bir versiyonunu tekrar yükleyeceğim.',
    description: 'Kullanıcının ek notu',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
