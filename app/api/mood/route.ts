import { auth } from "@/app/lib/auth"
import {
  getRecentTracks,
  getAudioFeatures,
  getRecommendations,
  getNowPlaying,
} from "@/app/lib/spotify"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = (session as any).accessToken

    if (!token) {
      return Response.json({ error: "No access token" }, { status: 401 })
    }

    const [nowPlaying, recent] = await Promise.all([
      getNowPlaying(token),
      getRecentTracks(token),
    ])

    if (!recent?.items?.length) {
      return Response.json({ error: "No recent tracks found" }, { status: 404 })
    }

    const tracks = recent.items.map((i: any) => i.track).filter(Boolean)
    const trackIds = tracks.map((t: any) => t.id).filter(Boolean)

    if (!trackIds.length) {
      return Response.json({ error: "No track IDs found" }, { status: 404 })
    }

    // Get audio features with safety check
    const audioFeaturesResponse = await getAudioFeatures(token, trackIds)
    const validFeatures = (audioFeaturesResponse?.audio_features ?? []).filter(Boolean)

    if (!validFeatures.length) {
      return Response.json({ error: "No audio features found" }, { status: 404 })
    }

    const avg = (key: string) =>
      validFeatures.reduce((sum: number, f: any) => sum + (f?.[key] ?? 0), 0) /
      validFeatures.length

    const features = {
      valence: avg("valence"),
      energy: avg("energy"),
      danceability: avg("danceability"),
      tempo: avg("tempo"),
      acousticness: avg("acousticness"),
    }

    const trackNames = tracks
      .slice(0, 8)
      .map((t: any) => `${t.name} by ${t.artists?.[0]?.name}`)
      .join(", ")

    const prompt = `A user has been listening to: ${trackNames}.
Audio features: valence=${features.valence.toFixed(2)} (happiness), energy=${features.energy.toFixed(2)}, danceability=${features.danceability.toFixed(2)}, tempo=${features.tempo.toFixed(0)}bpm, acousticness=${features.acousticness.toFixed(2)}.

Give a SHORT mood label (3-4 words max, e.g. "Energetic & Nostalgic") on the first line.
Then 1-2 warm sentences describing how they are feeling based on their music. Be conversational and relatable.`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const result = await response.json()
    const moodText = result.choices?.[0]?.message?.content ?? "Vibing & Grooving"
    const lines = moodText.split("\n").filter(Boolean)
    const moodLabel = lines[0].replace(/[*_"]/g, "").trim()
    const moodDescription = lines.slice(1).join(" ").trim()

    const recommendations = await getRecommendations(
      token,
      trackIds,
      features.valence,
      features.energy
    )

    return Response.json({
      nowPlaying: nowPlaying?.item ?? null,
      mood: moodLabel,
      moodDescription,
      features: {
        valence: Math.round(features.valence * 100),
        energy: Math.round(features.energy * 100),
        danceability: Math.round(features.danceability * 100),
        tempo: Math.round(features.tempo),
        acousticness: Math.round(features.acousticness * 100),
      },
      recentTracks: tracks.slice(0, 5),
      recommendations: recommendations?.tracks ?? [],
    })
  } catch (error) {
    console.error("Mood API error:", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}