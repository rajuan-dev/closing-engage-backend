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
        memberId?: string;
        memberRole?: 'Admin' | 'Member';
        permissions?: {
          createOrders: boolean;
          viewOrders: boolean;
          downloadDocuments: boolean;
        };
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
        memberId?: string;
        memberRole?: 'Admin' | 'Member';
        permissions?: {
          createOrders: boolean;
          viewOrders: boolean;
          downloadDocuments: boolean;
        };
      };
      requestId?: string;
    }
  }
}
