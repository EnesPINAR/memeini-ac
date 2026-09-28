import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMemeDto {
  @ApiProperty({ example: 'Cuma Akşamı Kod Pushlayınca', description: 'Meme başlığı' })
  @IsString()
  @IsNotEmpty({ message: 'Başlık alanı boş bırakılamaz' })
  title: string;

  @ApiProperty({
    example: 'yazılımcı,kod,bug,cuma',
    description: 'Virgülle ayrılmış etiketler listesi veya dizi',
  })
  @IsString()
  @IsNotEmpty({ message: 'En az bir etiket eklemelisiniz' })
  tags: string;

  @ApiPropertyOptional({
    example: 0.75,
    description: 'Genişlik / Yükseklik oranı (Otomatik hesaplanabilir, isteğe bağlı)',
  })
  @IsOptional()
  aspectRatio?: number;
}
