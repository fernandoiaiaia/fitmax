import { JwtPayload } from '../middlewares/auth';

declare global {
  namespace Express {
    interface Request {
      /**
       * Decoded JWT access token payload — populated by the `authenticate` middleware.
       */
      user?: JwtPayload;
    }
  }
}

export {};
