import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { Button } from '@/components/ui/button'

/**
 * 관리자 전용 페이지 (추후 확장)
 * 현재는 링크 관리로 연결
 */
export default function AdminPage() {
  const { token, signOut } = useAuth()

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-muted-foreground">관리자 로그인이 필요합니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-6 flex justify-end">
        <Button variant="outline" onClick={() => signOut()}>
          로그아웃
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <Link
          to="/links/admin"
          className="block rounded-xl border border-border/60 bg-card p-6 no-underline transition-colors hover:border-primary/20 hover:shadow-md"
        >
          <h2 className="font-semibold text-foreground">링크 관리</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            유용한 링크 추가·수정·삭제
          </p>
        </Link>
      </div>
    </div>
  )
}
