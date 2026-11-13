import type { Session } from 'express-session';
import { passport } from 'passport';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      passport?: passport;
      params?: {
        shareId?: string;
        folderId?: string;
        owned?: '0' | '1';
      };
      user?: {
        id: string;
        username: string;
      };
      logout?: class;
      popUp?: {
        title: string;
        text: string;
      };
      currentFolderId?: string;
      userIsOwner?: boolean;
      shareSessionTemp?: string;

      login(
        user: { username: string; password: string; id?: string },
        error: unknown,
      ): void;
    }

    interface Response {
      _body: {
        user?: {
          id: string;
        };
      };
    }
  }
}
