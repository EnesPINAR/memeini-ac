import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Şikayet edilen meme ID' })
  @IsUUID('4', { message: 'Geçerli bir meme UUID giriniz' })
  memeId: string;

  @ApiProperty({
    example: 'Uygunsuz veya Rahatsız Edici Görsel',
    description: 'Şikayet nedeni',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şikayet nedeni boş bırakılamaz' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Görsel topluluk kurallarına aykırı içerik barındırıyor.',
    description: 'Şikayet açıklaması (isteğe bağlı)',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
