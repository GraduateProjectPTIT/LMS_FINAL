import NextAuth from "next-auth/next"
import { AuthOptions, SessionStrategy } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
        })
    ],
    secret: process.env.SECRET,
    session: {
        strategy: "jwt" as SessionStrategy, // Dùng JWT để NextAuth không lưu session vào DB
    }
}

export default NextAuth(authOptions) 