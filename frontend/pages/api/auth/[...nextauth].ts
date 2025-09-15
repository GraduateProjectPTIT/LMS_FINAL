import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import type { NextApiRequest, NextApiResponse } from "next"

export default function auth(req: NextApiRequest, res: NextApiResponse) {
    return NextAuth(req, res, {
        providers: [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
            GithubProvider({
                clientId: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            }),
        ],
        secret: process.env.SECRET,
        session: { strategy: "jwt" },
        callbacks: {
            async signIn({ user }) {
                // đọc cookie từ req.headers
                const cookieHeader = req.headers.cookie || ""
                const match = cookieHeader.match(/pending_role=([^;]+)/)
                const cookieRole = match ? decodeURIComponent(match[1]) : null

                if (cookieRole) {
                    (user as any).role = cookieRole
                }
                return true
            },
            async jwt({ token, user }) {
                if (user?.role) token.role = (user as any).role
                return token
            },
            async session({ session, token }) {
                if (token.role) (session.user as any).role = token.role
                return session
            },
        },
    })
}
