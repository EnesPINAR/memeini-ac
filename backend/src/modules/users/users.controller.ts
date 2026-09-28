import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mevcut kullanıcının detaylı profil ve istatistik bilgileri' })
  @ApiResponse({ status: 200, description: 'Kullanıcı profili ve sayaçlar' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil bilgilerini güncelle (Biyografi, avatar, isim vb.)' })
  @ApiResponse({ status: 200, description: 'Güncellenmiş profil' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hesap şifresini değiştir' })
  @ApiResponse({ status: 200, description: 'Şifre başarıyla güncellendi' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get('me/uploaded')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kullanıcının yüklediği memeler ("Onay Bekliyor" rozeti dahil)',
  })
  @ApiResponse({ status: 200, description: 'Yüklenen memeler listesi' })
  async getUploadedMemes(@CurrentUser('id') userId: string) {
    return this.usersService.getUploadedMemes(userId);
  }

  @Get('me/starred')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kullanıcının puan verdiği memeler ve verilen yıldız sayısı (userScore)',
  })
  @ApiResponse({ status: 200, description: 'Puanlanan memeler listesi' })
  async getStarredMemes(@CurrentUser('id') userId: string) {
    return this.usersService.getStarredMemes(userId);
  }

  @Get('me/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının kaydettiği memeler koleksiyonu' })
  @ApiResponse({ status: 200, description: 'Kaydedilen memeler listesi' })
  async getSavedMemes(@CurrentUser('id') userId: string) {
    return this.usersService.getSavedMemes(userId);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Kullanıcı adına göre herkese açık profil' })
  @ApiResponse({ status: 200, description: 'Herkese açık profil bilgileri' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
