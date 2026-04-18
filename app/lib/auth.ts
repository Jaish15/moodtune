import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-top-read",
].join(" ")

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: SCOPES },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken
      return session
    },
  },
})