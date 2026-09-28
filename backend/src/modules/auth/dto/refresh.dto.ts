import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Geçerli Refresh Token' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token boş bırakılamaz' })
  refreshToken: string;
}
