export {};

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: 'admin';
      };
      company?: {
        id: string;
        email: string;
        role: 'company';
      };
      notary?: {
        id: string;
        email: string;
        role: 'notary';
      };
      auth?: {
        id: string;
        email: string;
        role: 'admin' | 'company' | 'notary';
      };
      requestId?: string;
    }
  }
}
