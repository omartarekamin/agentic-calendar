// Protects API routes by validating bearer session tokens and exposing the trusted user ID.
import type { AuthenticationInfo } from '@descope/node-sdk';
import type { RequestHandler, Response } from 'express';
import { descopeClient } from '../config/descope.js';
import { upsertUser, type UserRecord } from '../db/user.repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticationInfo['token'];
      userId?: string;
      dbUserId?: string;
    }
  }
}

type SessionInfo = Pick<AuthenticationInfo, 'token'>;
type SessionValidator = (token: string) => Promise<SessionInfo>;
type UserWriter = (
  authUserId: string,
  email: string | null,
) => Promise<Pick<UserRecord, 'id'>>;

const unauthorized = (res: Response): void => {
  res.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'A valid session is required',
    },
  });
};

export function createRequireSession(
  validateSession: SessionValidator,
  saveUser: UserWriter = upsertUser,
): RequestHandler {
  return async (req, res, next): Promise<void> => {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      unauthorized(res);
      return;
    }

    let authInfo: SessionInfo;
    try {
      authInfo = await validateSession(match[1]);
    } catch {
      unauthorized(res);
      return;
    }

    const userId = authInfo.token.sub;
    if (!userId) {
      unauthorized(res);
      return;
    }

    const email = typeof authInfo.token.email === 'string' ? authInfo.token.email : null;
    const userRecord = await saveUser(userId, email);

    req.user = authInfo.token;
    req.userId = userId;
    req.dbUserId = userRecord.id;
    next();
  };
}

export const requireSession = createRequireSession((token) =>
  descopeClient.validateSession(token),
);
