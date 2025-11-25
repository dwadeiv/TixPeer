import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ClassSerializerInterceptor,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../common/services/cloudinary.service';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Request() req: any, @Body() updateData: Partial<any>) {
    return this.usersService.update(req.user.id, updateData);
  }

  /**
   * Upload profile avatar image to Cloudinary
   * Accepts image file upload (jpg, jpeg, png, gif, webp)
   * Max file size: 5MB
   * Stores image in Cloudinary cloud storage with CDN delivery
   */
  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile avatar image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (req, file, cb) => {
        // Only allow image files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(
            new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  )
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Upload image to Cloudinary
      // The image is stored in the 'tixpeer/avatars' folder with a public ID based on user ID
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'tixpeer/avatars',
        `user-${req.user.id}`, // Public ID: user-{userId} for easy identification
      );

      // Get the secure CDN URL from Cloudinary
      const avatarUrl = uploadResult.secure_url;

      // Update user's avatar field in database with Cloudinary CDN URL
      const updatedUser = await this.usersService.update(req.user.id, {
        avatar: avatarUrl,
      });

      return {
        message: 'Avatar uploaded successfully to Cloudinary',
        avatar: avatarUrl,
        user: updatedUser,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }
}
