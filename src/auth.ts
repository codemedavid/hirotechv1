import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './lib/db';
import bcrypt from 'bcrypt';
import type { User, Role } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  basePath: '/api/auth',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing credentials');
            return null;
          }

          console.log('[Auth] Attempting login for:', credentials.email);

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
            include: {
              organization: true,
            },
          });

          if (!user) {
            console.log('[Auth] User not found:', credentials.email);
            return null;
          }

          if (!user.password) {
            console.log('[Auth] User has no password:', credentials.email);
            return null;
          }

          console.log('[Auth] Comparing passwords...');
          const isCorrectPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isCorrectPassword) {
            console.log('[Auth] Password mismatch for:', credentials.email);
            return null;
          }

          console.log('[Auth] Login successful for:', credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            image: user.image || undefined,
            role: user.role,
            organizationId: user.organizationId,
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.image = (user as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).image = token.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

