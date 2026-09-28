import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'EskiSifre123!', description: 'Mevcut şifre' })
  @IsString()
  @IsNotEmpty({ message: 'Mevcut şifre boş bırakılamaz' })
  oldPassword: string;

  @ApiProperty({ example: 'YeniGucluSifre123!', description: 'Yeni şifre (en az 6 karakter)' })
  @IsString()
  @MinLength(6, { message: 'Yeni şifre en az 6 karakter olmalıdır' })
  newPassword: string;
}
