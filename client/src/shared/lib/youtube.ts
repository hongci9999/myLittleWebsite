/** 유튜브 URL에서 비디오 ID 추출 (watch, youtu.be, shorts, embed) */
export function parseYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const h = u.hostname.replace(/^www\./, '')
    if (h === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (h === 'youtube.com' || h === 'm.youtube.com') {
      if (u.pathname === '/watch' || u.pathname.startsWith('/watch')) {
        const v = u.searchParams.get('v')
        return v && /^[\w-]{6,}$/.test(v) ? v : null
      }
      if (u.pathname.startsWith('/embed/')) {
        const id = u.pathname.split('/')[2]
        return id && /^[\w-]{6,}$/.test(id) ? id : null
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2]
        return id && /^[\w-]{6,}$/.test(id) ? id : null
      }
    }
  } catch {
    return null
  }
  return null
}

export function youtubeNocookieEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
}
