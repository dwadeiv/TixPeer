import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

/**
 * CloudinaryService
 *
 * Handles image uploads to Cloudinary cloud storage service.
 * Provides production-ready image hosting with CDN delivery.
 *
 * Features:
 * - Automatic image optimization
 * - CDN delivery for fast image loading
 * - Transformation capabilities (resize, crop, format conversion)
 * - 25GB free storage and bandwidth
 *
 * Future Migration Path to AWS S3:
 * - When scaling to millions of images
 * - When needing full AWS integration
 * - When requiring enterprise-level control
 * - When optimizing cost per GB at massive scale
 */
@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary with credentials from environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload image file to Cloudinary
   *
   * @param file - The file buffer to upload
   * @param folder - Cloudinary folder path (e.g., 'avatars', 'events')
   * @param publicId - Optional custom public ID for the image
   * @returns Promise with upload result containing secure_url (CDN URL)
   *
   * The returned secure_url is a permanent CDN URL that can be stored in the database
   * and used to display images from any environment (dev, staging, production)
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Upload using upload_stream for buffer-based uploads (no temp file needed)
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder, // Organize images in Cloudinary folders
          public_id: publicId, // Optional: custom filename
          resource_type: 'image',
          // Image transformations can be added here if needed
          // For example: width: 500, height: 500, crop: 'limit'
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      // Write file buffer to the upload stream
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete image from Cloudinary by public ID
   *
   * @param publicId - The Cloudinary public ID of the image to delete
   * @returns Promise with deletion result
   *
   * Useful for cleaning up old images when users upload new ones
   * Public ID format: "folder/filename" (without extension)
   */
  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Get optimized image URL with transformations
   *
   * @param publicId - The Cloudinary public ID
   * @param transformations - Optional transformation parameters
   * @returns Optimized image URL
   *
   * Example transformations:
   * - { width: 200, height: 200, crop: 'fill' } - Square thumbnail
   * - { quality: 'auto', fetch_format: 'auto' } - Auto optimization
   */
  getImageUrl(publicId: string, transformations?: any): string {
    return cloudinary.url(publicId, transformations);
  }
}
