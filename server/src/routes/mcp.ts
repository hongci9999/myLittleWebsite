/**
 * MCP 서버 (Streamable HTTP, stateless) — 인증 없음, 읽기 전용.
 * 노출 데이터는 이미 사이트에 공개된 것뿐이다. 도구 정의는 services/knowledge.
 */
import { Router } from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { knowledgeTools } from '../services/knowledge/index.js'

function createServer(): McpServer {
  const server = new McpServer({ name: 'my-little-website', version: '1.0.0' })
  for (const t of knowledgeTools) {
    server.registerTool(
      t.name,
      { description: t.description, inputSchema: t.inputSchema, annotations: { readOnlyHint: true } },
      async (args: unknown) => {
        try {
          const result = await t.handler(args ?? {})
          return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] }
        } catch (err) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }],
          }
        }
      }
    )
  }
  return server
}

const router = Router()

// 요청마다 서버·transport 새로 생성 (SDK stateless 패턴, 서버리스에 맞음)
router.post('/', async (req, res) => {
  const server = createServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => {
    transport.close()
    server.close()
  })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

router.all('/', (_req, res) => {
  res.status(405).set('Allow', 'POST').json({ error: 'Method not allowed' })
})

export default router
