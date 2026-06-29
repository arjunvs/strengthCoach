import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import type { JwtPayload } from './auth.types';

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { code: 'EMAIL_IN_USE', status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    const token = this._signToken({ userId: user.id, email: user.email });
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }
    const token = this._signToken({ userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  private _signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as Parameters<typeof jwt.sign>[2]);
  }
}

export const authService = new AuthService();
