/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/db/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compareSync } from 'bcrypt-ts-edge'

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      name: string
      email: string
    }
  }

  interface User {
    role: string
  }

  interface JWT {
    role: string
  }
}

// Create the auth options object
const authOptions: any = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (credentials == null) return null

        // Find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        })

        // Check if user exists and if the password matches
        if (user && user.password) {
          const isMatch = await compareSync(
            credentials.password as string,
            user.password
          )

          // If password is correct, return user
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          }
        }
        // If user does not exist or password does not match return null
        return null
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      // Set the user ID from the token
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.name = token.name
      }
      return session
    },
    async jwt({ token, user, trigger, session }: any) {
      // Assign user fields to token
      if (user) {
        token.role = user.role

        // If user has no name then use the email
        if (user.name === 'NO_NAME') {
          token.name = user.email!.split('@')[0]

          // Update database to reflect the token name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          })
        }

        // Handle cart merging on sign-in/sign-up
        if (trigger === 'signIn' || trigger === 'signUp') {
          const { cookies } = await import('next/headers')
          const cookiesStore = await cookies()
          const sessionCartId = cookiesStore.get('sessionCartId')?.value

          if (sessionCartId) {
            const sessionCart = await prisma.cart.findFirst({
              where: { sessionCartId },
            })

            if (sessionCart) {
              // Delete current user cart
              await prisma.cart.deleteMany({
                where: { userId: user.id },
              })

              // Assign new cart
              await prisma.cart.update({
                where: { id: sessionCart.id },
                data: { userId: user.id },
              })
            }
          }
        }
      }

      // Handle session updates
      if (session?.user?.name && trigger === 'update') {
        token.name = session.user.name
      }

      return token
    },
  },
}

// Create the handler
const handler = NextAuth(authOptions)

// Export as named exports
export { handler as GET, handler as POST }
