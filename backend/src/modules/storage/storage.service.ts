import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadResult } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import imageSize from 'image-size';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: string;
  private readonly uploadDir: string;
  private readonly appUrl: string;
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicDomain?: string;

  constructor(private configService: ConfigService) {
    this.driver = this.configService.get<string>('storage.driver', 'local');
    this.uploadDir = this.configService.get<string>('storage.uploadDir', 'uploads');
    this.appUrl = this.configService.get<string>('appUrl', 'http://localhost:3000');
    this.bucketName = this.configService.get<string>('storage.aws.bucketName', 'memeini-media');
    this.publicDomain = this.configService.get<string>('storage.aws.publicDomain');

    if (this.driver === 's3') {
      const region = this.configService.get<string>('storage.aws.region', 'eu-central-1');
      const accessKeyId = this.configService.get<string>('storage.aws.accessKeyId');
      const secretAccessKey = this.configService.get<string>('storage.aws.secretAccessKey');
      const endpoint = this.configService.get<string>('storage.aws.endpoint');

      if (accessKeyId && secretAccessKey) {
        this.s3Client = new S3Client({
          region,
          endpoint: endpoint || undefined,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: !!endpoint, // required for MinIO / Supabase / local S3
        });
        this.logger.log(`Initialized S3 storage driver for bucket: ${this.bucketName}`);
      } else {
        this.logger.warn('AWS S3 credentials not provided. Falling back to local storage driver.');
        this.driver = 'local';
      }
    }

    if (this.driver === 'local') {
      const fullPath = path.isAbsolute(this.uploadDir)
        ? this.uploadDir
        : path.join(process.cwd(), this.uploadDir);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Created uploads directory at: ${fullPath}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    const isVideo = file.mimetype.startsWith('video/');
    const mediaType: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
    const ext = path.extname(file.originalname) || (isVideo ? '.mp4' : '.jpg');
    const filename = `${crypto.randomUUID()}${ext}`;

    let aspectRatio = 1.0;
    if (!isVideo && file.buffer) {
      try {
        const dimensions = imageSize(file.buffer);
        if (dimensions && dimensions.width && dimensions.height) {
          aspectRatio = parseFloat((dimensions.width / dimensions.height).toFixed(2));
        }
      } catch (err) {
        this.logger.warn(`Could not determine image dimensions: ${err.message}`);
      }
    }

    if (this.driver === 's3' && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      const url = this.publicDomain
        ? `${this.publicDomain}/${filename}`
        : `https://${this.bucketName}.s3.${this.configService.get('storage.aws.region')}.amazonaws.com/${filename}`;

      return {
        url,
        filename,
        mediaType,
        aspectRatio,
        size: file.size,
      };
    }

    // Local Storage
    const fullPath = path.isAbsolute(this.uploadDir)
      ? path.join(this.uploadDir, filename)
      : path.join(process.cwd(), this.uploadDir, filename);

    fs.writeFileSync(fullPath, file.buffer);
    const url = `${this.appUrl}/uploads/${filename}`;

    return {
      url,
      filename,
      mediaType,
      aspectRatio,
      size: file.size,
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (this.driver === 's3' && this.s3Client) {
        const key = fileUrl.split('/').pop();
        if (!key) return false;

        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
        return true;
      }

      // Local deletion
      const filename = fileUrl.split('/').pop();
      if (!filename) return false;

      const fullPath = path.isAbsolute(this.uploadDir)
        ? path.join(this.uploadDir, filename)
        : path.join(process.cwd(), this.uploadDir, filename);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error(`Error deleting file ${fileUrl}: ${err.message}`);
      return false;
    }
  }
}
