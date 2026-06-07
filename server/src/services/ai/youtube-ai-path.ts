import { parseYoutubeVideoId } from '../youtube-transcript-text.js'

export function isYoutubeWatchUrl(url: string): boolean {
  return parseYoutubeVideoId(url.trim()) != null
}
