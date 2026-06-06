import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your dashboard!</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">You are successfully authenticated.</p>
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">User Information</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Email: {user.email}</p>
                <p>User ID: <Badge variant="secondary" className="font-mono text-xs">{user.id}</Badge></p>
                <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This is a protected route. Only authenticated users can access this page.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
