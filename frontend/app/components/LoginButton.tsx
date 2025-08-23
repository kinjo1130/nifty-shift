'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <button className="px-4 py-2 bg-gray-200 rounded">Loading...</button>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span>{session.user?.name}</span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Sign in with Google
    </button>
  )
}