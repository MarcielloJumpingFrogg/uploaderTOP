import { session } from "express-session"
import { passport } from "passport"

declare global {
  namespace Express {
    interface Request {
      session?: session
      passport?: passport
      user?: string
      logout?: class
    }
  }
}
