import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const runtime = 'edge'

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // TODO: Supabase Authと連携（メール/パスワードやOAuth）
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full">Sign in</Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            <a className="text-blue-600 hover:underline" href="/register">Create an account</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


