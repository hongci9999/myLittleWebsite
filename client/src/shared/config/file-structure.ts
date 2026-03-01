/**
 * 파일 구조형 콘텐츠 공통 스키마 (재귀 구조)
 * 학습자료, 포트폴리오 등 계층적 드릴다운 UI 재사용
 */
export interface FileStructureDoc {
  slug: string
  title: string
  /** public 기준 상대 경로 (fetch URL) */
  filePath: string
}

/** 재귀 노드: children 또는 docs 중 하나 이상 */
export interface FileStructureNode {
  id: string
  name: string
  description?: string
  children?: FileStructureNode[]
  docs?: FileStructureDoc[]
}

export interface FileStructureSection {
  sectionId: string
  sectionLabel: string
  /** md fetch용 base path (예: /learnings/정처기) */
  basePath: string
  nodes: FileStructureNode[]
}

export interface FileStructureParent {
  parentPath: string
  parentLabel: string
  sections: FileStructureSection[]
}

export type ResolveResult =
  | { type: 'node-list'; nodes: FileStructureNode[]; pathSegments: string[] }
  | { type: 'doc-list'; docs: FileStructureDoc[]; pathSegments: string[]; node: FileStructureNode }
  | { type: 'doc'; doc: FileStructureDoc; basePath: string; pathSegments: string[] }

/** 섹션별 전체 경로 */
export function getSectionPath(parentPath: string, sectionId: string): string {
  return `${parentPath}/${sectionId}`
}

const REGISTRY: FileStructureParent[] = []

export function registerFileStructureParent(config: FileStructureParent): void {
  REGISTRY.push(config)
}

export function getFileStructureParent(parentPath: string): FileStructureParent | undefined {
  return REGISTRY.find((p) => p.parentPath === parentPath)
}

export function getFileStructureSection(
  parentPath: string,
  sectionId: string
): FileStructureSection | undefined {
  const parent = getFileStructureParent(parentPath)
  return parent?.sections.find((s) => s.sectionId === sectionId)
}

function resolveFromNodes(
  nodes: FileStructureNode[],
  pathParts: string[],
  basePath: string,
  pathSegments: string[]
): ResolveResult | null {
  if (pathParts.length === 0) {
    return { type: 'node-list', nodes, pathSegments }
  }

  const [first, ...rest] = pathParts
  const node = nodes.find((n) => n.id === first)
  if (!node) return null

  const newPathSegments = [...pathSegments, first]

  if (node.children && node.children.length > 0) {
    if (rest.length === 0) {
      return { type: 'node-list', nodes: node.children, pathSegments: newPathSegments }
    }
    return resolveFromNodes(node.children, rest, basePath, newPathSegments)
  }

  if (node.docs && node.docs.length > 0) {
    if (rest.length === 0) {
      return { type: 'doc-list', docs: node.docs, pathSegments: newPathSegments, node }
    }
    if (rest.length === 1) {
      const doc = node.docs.find((d) => d.slug === rest[0])
      if (doc) return { type: 'doc', doc, basePath, pathSegments: newPathSegments }
    }
    return null
  }

  return null
}

/** 경로 해석: sectionId + pathParts → ResolveResult */
export function resolveFileStructurePath(
  parentPath: string,
  sectionId: string,
  pathParts: string[]
): ResolveResult | null {
  const section = getFileStructureSection(parentPath, sectionId)
  if (!section) return null

  if (pathParts.length === 0) {
    return { type: 'node-list', nodes: section.nodes, pathSegments: [] }
  }

  return resolveFromNodes(section.nodes, pathParts, section.basePath, [])
}

/** pathSegments를 URL 경로로 조합 */
export function buildPath(parentPath: string, sectionId: string, pathSegments: string[]): string {
  const base = `${parentPath}/${sectionId}`
  if (pathSegments.length === 0) return base
  return `${base}/${pathSegments.join('/')}`
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

function buildBreadcrumbFromPath(
  parent: FileStructureParent,
  section: FileStructureSection,
  pathParts: string[]
): BreadcrumbItem[] | null {
  const items: BreadcrumbItem[] = [
    { label: parent.parentLabel, href: parent.parentPath },
    { label: section.sectionLabel, href: `${parent.parentPath}/${section.sectionId}` },
  ]

  let currentPath = `${parent.parentPath}/${section.sectionId}`
  let currentNodes = section.nodes

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    const node = currentNodes.find((n) => n.id === part)

    if (node) {
      currentPath = `${currentPath}/${node.id}`
      items.push({ label: node.name, href: currentPath })

      if (node.children?.length) {
        currentNodes = node.children
      } else if (node.docs?.length) {
        if (i === pathParts.length - 1) {
          items[items.length - 1].href = undefined
          return items
        }
        const doc = node.docs.find((d) => d.slug === pathParts[i + 1])
        if (doc) {
          items.push({ label: doc.title, href: undefined })
          return items
        }
        return null
      }
    } else if (i > 0 && currentNodes.length > 0) {
      const prevNode = currentNodes.find((n) => n.id === pathParts[i - 1])
      if (prevNode?.docs) {
        const doc = prevNode.docs.find((d) => d.slug === part)
        if (doc) {
          items.push({ label: doc.title, href: undefined })
          return items
        }
      }
      return null
    } else {
      return null
    }
  }

  items[items.length - 1].href = undefined
  return items
}

/** breadcrumb용: pathname에서 file-structure 경로 해석 (재귀) */
export function getFileStructureBreadcrumb(pathname: string): BreadcrumbItem[] | null {
  const normalizedPath = pathname.replace(/\/$/, '')

  for (const parent of REGISTRY) {
    if (
      normalizedPath !== parent.parentPath &&
      !normalizedPath.startsWith(parent.parentPath + '/')
    ) {
      continue
    }

    const rest = normalizedPath.slice(parent.parentPath.length).replace(/^\//, '')
    const parts = rest ? rest.split('/').map(safeDecode) : []

    if (parts.length === 0) {
      return [{ label: parent.parentLabel, href: undefined }]
    }

    const [sectionId, ...pathParts] = parts
    const section = sectionId ? getFileStructureSection(parent.parentPath, sectionId) : undefined
    if (!section) return null

    return buildBreadcrumbFromPath(parent, section, pathParts)
  }
  return null
}
