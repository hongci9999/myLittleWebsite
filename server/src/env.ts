/**
 * 앱 진입 전 .env 로드 (다른 import보다 먼저 실행되어야 함)
 */
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')
const result = dotenv.config({ path: envPath })
if (result.error) {
  console.warn('[env] server/.env 로드 실패:', result.error.message)
} else if (result.parsed) {
  console.log('[env] 로드됨:', Object.keys(result.parsed).join(', '))
}
dotenv.config()
