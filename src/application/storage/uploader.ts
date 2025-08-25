export interface UploadParams {
  fileName: string;
  fileType: string;
  body: Buffer;
}

export interface Uploader {
    upload(uploadParams: UploadParams): Promise<{url: string}>;
    remove(url: string): Promise<void>;
}