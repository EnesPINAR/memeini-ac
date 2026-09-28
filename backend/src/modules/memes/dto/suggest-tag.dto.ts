import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SuggestTagDto {
  @ApiProperty({ example: 'yazılımcı', description: 'Önerilen etiket adı' })
  @IsString()
  @IsNotEmpty({ message: 'Etiket adı boş bırakılamaz' })
  @MinLength(2, { message: 'Etiket adı en az 2 karakter olmalıdır' })
  tagName: string;
}
