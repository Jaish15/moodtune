"use client"

import { useEffect, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  uri: string
}

interface MoodData {
  nowPlaying: Track | null
  mood: string
  moodDescription: string
  features: {
    valence: number
    energy: number
    danceability: number
    tempo: number
  }
  recentTracks: Track[]
  recommendations: Track[]
}

export default function Home() {
  const { data: session, status } = useSession()
  const [moodData, setMoodData] = useState<MoodData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchMood()
    }
  }, [session])

  async function fetchMood() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/mood")
      if (!res.ok) throw new Error("Failed to fetch mood")
      const data = await res.json()
      setMoodData(data)
    } catch (e) {
      setError("Couldn't load your mood data. Try again!")
    } finally {
      setLoading(false)
    }
  }

  async function savePlaylist() {
    if (!moodData?.recommendations?.length) return
    setSaving(true)
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackUris: moodData.recommendations.map((t) => t.uri),
          playlistName: "MoodTune: " + moodData.mood + " 🎵",
        }),
      })
      const data = await res.json()
      if (data.playlistUrl) setSavedUrl(data.playlistUrl)
    } catch (e) {
      setError("Failed to save playlist. Try again!")
    } finally {
      setSaving(false)
    }
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">MoodTune</h1>
          <p className="text-zinc-400 text-lg max-w-md">
            Analyse your mood from your Spotify listening history and get a personalised playlist.
          </p>
        </div>
        <button
          onClick={() => signIn("spotify")}
          className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-4 rounded-full text-lg transition-all"
        >
          Connect with Spotify
        </button>
      </main>
    )
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        <p className="text-zinc-400">Analysing your vibe...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <span className="font-bold text-lg">MoodTune</span>
        <div className="flex items-center gap-3">
          <button onClick={fetchMood} className="text-sm text-zinc-400 hover:text-white transition-colors">Refresh</button>
          <button onClick={() => signOut()} className="text-sm text-zinc-400 hover:text-white transition-colors">Sign out</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}

      {moodData && (
        <div>
          {moodData.nowPlaying && (
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4 flex items-center gap-4 border border-zinc-800">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-400 font-medium mb-1">Now playing</p>
                <p className="font-semibold truncate">{moodData.nowPlaying.name}</p>
                <p className="text-zinc-400 text-sm truncate">
                  {moodData.nowPlaying.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 rounded-2xl p-6 mb-4 border border-zinc-800">
            <p className="text-xs text-violet-400 font-medium uppercase tracking-widest mb-2">Your mood right now</p>
            <h2 className="text-3xl font-bold mb-3">{moodData.mood}</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">{moodData.moodDescription}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Happiness</p>
              <p className="text-xl font-semibold">{moodData.features.valence}%</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Energy</p>
              <p className="text-xl font-semibold">{moodData.features.energy}%</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Tempo</p>
              <p className="text-xl font-semibold">{moodData.features.tempo} bpm</p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Suggested for your mood</p>
            <div className="flex flex-col gap-3">
              {moodData.recommendations.map((track) => (
                <div key={track.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                  </div>
                </div>
              ))}
            </div>

            {savedUrl ? (
              <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl text-sm">
                Playlist saved — Open in Spotify
              </a>
            ) : (
              <button onClick={savePlaylist} disabled={saving} className="mt-4 w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl text-sm">
                {saving ? "Saving..." : "Save all to Spotify 🎵"}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
