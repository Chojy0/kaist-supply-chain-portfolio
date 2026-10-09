import { FileValidator } from '@nestjs/common';

export class LcaFileValidator extends FileValidator {
  private readonly allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/json', // .json
  ];

  private readonly allowedExtensions = ['.xlsx', '.xls', '.csv', '.json'];

  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return true; // 파일은 선택사항
    }

    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    const isValidMimeType = this.allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = this.allowedExtensions.includes(fileExtension);

    return isValidExtension && (isValidMimeType || file.mimetype === 'application/octet-stream');
  }

  buildErrorMessage(): string {
    return 'Invalid file type. Only Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files are allowed.';
  }
}