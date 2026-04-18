import { auth } from "@/app/lib/auth"
import { createPlaylist, getUserProfile } from "@/app/lib/spotify"

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { trackUris, playlistName } = await request.json()

    if (!trackUris?.length) {
      return Response.json({ error: "No tracks provided" }, { status: 400 })
    }

    const token = session.accessToken

    // 1. Get user's Spotify ID
    const profile = await getUserProfile(token)

    // 2. Create playlist and add tracks
    const playlist = await createPlaylist(
      token,
      profile.id,
      playlistName ?? "My MoodTune Playlist 🎵",
      trackUris
    )

    return Response.json({
      success: true,
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls?.spotify,
      name: playlist.name,
    })
  } catch (error) {
    console.error("Playlist API error:", error)
    return Response.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}