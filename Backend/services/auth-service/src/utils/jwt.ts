import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '8h';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, REFRESH_SECRET) as TokenPayload;
