import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Store Gmail tokens encrypted if Google login has them
      if (account?.provider === 'google' && account.access_token && account.refresh_token) {
        try {
          const { encryptToken } = await import('@/lib/security/encryption');
          await prisma.gmailToken.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              accessToken: encryptToken(account.access_token),
              refreshToken: encryptToken(account.refresh_token),
              expiresAt: new Date((account.expires_at ?? Date.now() / 1000 + 3600) * 1000),
              gmailEmail: user.email ?? '',
            },
            update: {
              accessToken: encryptToken(account.access_token),
              refreshToken: encryptToken(account.refresh_token),
              expiresAt: new Date((account.expires_at ?? Date.now() / 1000 + 3600) * 1000),
            },
          });
        } catch (err) {
          console.error('Failed to store Gmail tokens:', err);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async createUser({ user }) {
      // Initialize profile on first sign-in
      if (user.id) {
        await prisma.profile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            fullName: user.name ?? undefined,
          },
          update: {},
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}
