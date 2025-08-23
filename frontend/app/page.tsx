'use server'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import LoginButton from './components/LoginButton'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/schedules')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Nifty Shift</h1>
          <p className="mt-4 text-lg text-gray-600">
            かんたんシフト管理・日程調整ツール
          </p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">はじめる</h2>
          <p className="text-gray-600 mb-6">
            Googleアカウントでログインして、シフト管理を始めましょう
          </p>
          <LoginButton />
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>ログインすることで利用規約に同意したものとみなされます</p>
        </div>
      </div>
    </main>
  )
}