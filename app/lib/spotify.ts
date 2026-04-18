export async function getNowPlaying(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (res.status === 204 || res.status === 404) return null
  return res.json()
}

export async function getRecentTracks(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  return res.json()
}

export async function getAudioFeatures(accessToken: string, trackIds: string[]) {
  const ids = trackIds.join(",")
  const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  return res.json()
}

export async function getRecommendations(
  accessToken: string,
  seedTrackIds: string[],
  targetValence: number,
  targetEnergy: number
) {
  const params = new URLSearchParams({
    seed_tracks: seedTrackIds.slice(0, 5).join(","),
    target_valence: targetValence.toString(),
    target_energy: targetEnergy.toString(),
    limit: "10",
  })
  const res = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  return res.json()
}

export async function getUserProfile(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  return res.json()
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  trackUris: string[]
) {
  const playlist = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      public: false,
      description: "Created by MoodTune 🎵",
    }),
  }).then((r) => r.json())

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  })

  return playlist
}