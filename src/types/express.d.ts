import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      file?: Express.Multer.File;
    }
  }
}

export interface AuthRequest extends Request {
  adminId?: string;
}