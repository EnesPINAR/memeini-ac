import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'enes', description: 'Kullanıcı adı veya e-posta adresi' })
  @IsString()
  @IsNotEmpty({ message: 'Kullanıcı adı veya e-posta boş bırakılamaz' })
  identifier: string;

  @ApiProperty({ example: 'GizliSifre123!', description: 'Hesap şifresi' })
  @IsString()
  @IsNotEmpty({ message: 'Şifre boş bırakılamaz' })
  password: string;
}
