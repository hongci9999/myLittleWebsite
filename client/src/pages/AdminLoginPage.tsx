import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/main'
  const { token, isLoading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (!isLoading && token) {
      navigate(redirect, { replace: true })
    }
  }, [token, isLoading, redirect, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const { error } = await signIn(email, password)
    if (error) {
      setLoginError(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (token) {
    return null
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-card p-8 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2"
          />
        </div>
        {loginError && (
          <p className="text-sm text-destructive">{loginError}</p>
        )}
        <Button type="submit" className="w-full">
          로그인
        </Button>
      </form>
    </div>
  )
}
