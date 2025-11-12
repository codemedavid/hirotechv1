import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: Role;
      organizationId: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: Role;
    organizationId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    organizationId: string;
    image?: string;
  }
}

