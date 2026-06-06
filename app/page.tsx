import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="w-full max-w-3xl px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Next.js + Supabase Auth
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Production-ready authentication boilerplate with server-side session
            management, secure cookie handling, and full TypeScript support.
          </p>

          {user ? (
            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
              <Link
                href="/dashboard"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-gray-700"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}

          <div className="mt-16">
            <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Features
              </h2>
              <ul className="text-left text-sm text-gray-600 space-y-2">
                <li>✓ Server-side authentication with Supabase SSR</li>
                <li>✓ Secure cookie-based session management</li>
                <li>✓ Email/password authentication</li>
                <li>✓ Password reset flow</li>
                <li>✓ Email verification</li>
                <li>✓ Protected routes with middleware</li>
                <li>✓ Fully typed with TypeScript</li>
                <li>✓ Production-ready UI with Tailwind CSS</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
