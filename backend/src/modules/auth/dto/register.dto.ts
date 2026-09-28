import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'enes@memeinibul.com', description: 'Kullanıcı e-posta adresi' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'enes', description: 'Benzersiz kullanıcı adı (küçük harf)' })
  @IsString()
  @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz' })
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  @Matches(/^[a-z0-9_]+$/, { message: 'Kullanıcı adı sadece küçük harf, rakam ve alt çizgi içerebilir' })
  username: string;

  @ApiProperty({ example: 'GizliSifre123!', description: 'Hesap şifresi (en az 6 karakter)' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ example: 'Enes Pınar', description: 'Görünen isim' })
  @IsString()
  @IsNotEmpty({ message: 'Görünen isim boş bırakılamaz' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Her duruma uygun bir meme mutlaka vardır 🎯' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: '🐹' })
  @IsString()
  @IsOptional()
  avatarEmoji?: string;

  @ApiPropertyOptional({ example: '#FFE600' })
  @IsString()
  @IsOptional()
  avatarBg?: string;
}
