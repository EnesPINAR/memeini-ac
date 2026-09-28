export interface UploadResult {
  url: string;
  filename: string;
  mediaType: 'IMAGE' | 'VIDEO';
  aspectRatio: number;
  size: number;
}

export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<UploadResult>;
  deleteFile(fileUrl: string): Promise<boolean>;
}
