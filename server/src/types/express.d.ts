import type { Types } from 'mongoose';
import type { Role } from '../models/User.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface AuthUser {
      id: string;
      name: string;
      email: string;
      role: Role;
      storeId: Types.ObjectId;
    }
    interface Request {
      user?: AuthUser;
    }
  }
}
export {};
