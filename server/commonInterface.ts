import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedUser extends Request {
  user?: User;
}