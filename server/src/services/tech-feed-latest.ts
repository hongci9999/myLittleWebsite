import { fetchD2HelloWorldLatest, type D2HelloWorldVideo } from './d2-helloworld-atom.js'
import { fetchTechBlogsLatest, type TechBlogPost } from './tech-blogs.js'

export type TechFeedLatest = {
  d2Video: D2HelloWorldVideo | null
  blogs: TechBlogPost[]
}

export async function fetchTechFeedLatest(): Promise<TechFeedLatest> {
  const [d2Items, blogs] = await Promise.all([
    fetchD2HelloWorldLatest(1).catch((err) => {
      console.error('[tech-feed] d2-helloworld error:', err)
      return [] as D2HelloWorldVideo[]
    }),
    fetchTechBlogsLatest(),
  ])

  return {
    d2Video: d2Items[0] ?? null,
    blogs,
  }
}
