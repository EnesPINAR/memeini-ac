import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Enes Pınar', description: 'Görünen isim' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Her duruma uygun bir meme mutlaka vardır 🎯',
    description: 'Biyografi metni',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({ example: '🐹', description: 'Profil emojisi' })
  @IsOptional()
  @IsString()
  avatarEmoji?: string;

  @ApiPropertyOptional({ example: '#FFE600', description: 'Avatar arka plan rengi' })
  @IsOptional()
  @IsString()
  avatarBg?: string;

  @ApiPropertyOptional({ example: true, description: 'Bildirim açık/kapalı durumu' })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
}
