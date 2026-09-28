import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class RateMemeDto {
  @ApiProperty({
    example: 5,
    description: 'Verilen puan (1 ile 5 arasında tam sayı)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Puan bir tam sayı olmalıdır' })
  @Min(1, { message: 'Puan en az 1 olabilir' })
  @Max(5, { message: 'Puan en fazla 5 olabilir' })
  score: number;
}
