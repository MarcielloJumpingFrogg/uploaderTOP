import { session } from "express-session";
import { passport } from "passport";

declare global {
  namespace Express {
    interface Request {
      session?: session;
      passport?: passport;
      params?: {
        shareId: string;
      };
      user?: {
        id: string;
      };
      logout?: class;
      popUp?: {
        title: string;
        text: string;
      };
    }
  }
}
