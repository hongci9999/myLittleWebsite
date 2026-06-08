const REPO_OWNER = 'gyoogle'
const REPO_NAME = 'tech-interview-for-developer'
const BRANCH = 'master'

/** gyoogle/tech-interview-for-developer 상위 폴더 (CS = Computer Science) */
const ALLOWED_TOP_FOLDERS = [
  'Computer Science',
  'Algorithm',
  'Design Pattern',
  'Web',
  'Language',
] as const

const CATEGORY_LABELS: Record<(typeof ALLOWED_TOP_FOLDERS)[number], string> = {
  'Computer Science': 'CS',
  Algorithm: '알고리즘',
  'Design Pattern': '디자인 패턴',
  Web: '웹',
  Language: '언어',
}

const LIST_TTL_MS = 24 * 60 * 60 * 1000

type MdFileEntry = {
  path: string
  category: string
}

type TreeCache = {
  fetchedAt: number
  files: MdFileEntry[]
}

let treeCache: TreeCache | null = null

export type TechInterviewRandomDoc = {
  path: string
  category: string
  title: string
  content: string
  githubUrl: string
}

function githubHeaders(): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'myLittleWebsite-tech-interview-widget',
  }
}

function encodeRepoPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

export function githubBlobUrl(path: string): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${encodeRepoPath(path)}`
}

export function githubRawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${encodeRepoPath(path)}`
}

function categoryFromPath(path: string): string {
  const top = path.split('/')[0] as (typeof ALLOWED_TOP_FOLDERS)[number]
  return CATEGORY_LABELS[top] ?? top
}

function titleFromFilename(path: string): string {
  const base = path.split('/').pop() ?? path
  return decodeURIComponent(base.replace(/\.md$/i, ''))
}

function extractTitle(content: string, fallback: string): string {
  const h1 = content.match(/^#\s+(.+)$/m)
  if (h1?.[1]?.trim()) return h1[1].trim()
  const h2 = content.match(/^##\s+(.+)$/m)
  if (h2?.[1]?.trim()) return h2[1].trim()
  return fallback
}

function isAllowedMdPath(path: string): boolean {
  if (!path.endsWith('.md')) return false
  const top = path.split('/')[0]
  if (!ALLOWED_TOP_FOLDERS.includes(top as (typeof ALLOWED_TOP_FOLDERS)[number])) {
    return false
  }
  const name = path.split('/').pop() ?? ''
  if (name.toUpperCase() === 'README.MD') return false
  return true
}

async function fetchMdFileList(): Promise<MdFileEntry[]> {
  const now = Date.now()
  if (treeCache && now - treeCache.fetchedAt < LIST_TTL_MS) {
    return treeCache.files
  }

  const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`
  const res = await fetch(treeUrl, { headers: githubHeaders() })
  if (!res.ok) {
    throw new Error(`GitHub tree request failed (${res.status})`)
  }

  const data = (await res.json()) as {
    tree?: { type: string; path: string }[]
  }

  const files: MdFileEntry[] = (data.tree ?? [])
    .filter((node) => node.type === 'blob' && isAllowedMdPath(node.path))
    .map((node) => ({
      path: node.path,
      category: categoryFromPath(node.path),
    }))

  if (files.length === 0) {
    throw new Error('No markdown documents found in allowed folders')
  }

  treeCache = { fetchedAt: now, files }
  return files
}

export async function pickRandomTechInterviewDoc(): Promise<TechInterviewRandomDoc> {
  const files = await fetchMdFileList()
  const pick = files[Math.floor(Math.random() * files.length)]

  const rawRes = await fetch(githubRawUrl(pick.path), {
    headers: { 'User-Agent': 'myLittleWebsite-tech-interview-widget' },
  })
  if (!rawRes.ok) {
    throw new Error(`GitHub raw content request failed (${rawRes.status})`)
  }

  const content = await rawRes.text()
  const title = extractTitle(content, titleFromFilename(pick.path))

  return {
    path: pick.path,
    category: pick.category,
    title,
    content,
    githubUrl: githubBlobUrl(pick.path),
  }
}
