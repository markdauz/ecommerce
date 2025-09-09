import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Client-side configuration for auth utilities
export const { auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize() {
        // Placeholder - actual auth happens in API route
        return null
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      // Client-side session adjustments
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.name = token.name ?? ''
      }
      return session
    },
  },
})
