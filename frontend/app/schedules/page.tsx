'use server'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

async function getSchedules(userEmail: string) {
  const schedules = await prisma.schedule.findMany({
    where: {
      ownerUser: {
        email: userEmail
      }
    },
    include: {
      slots: true,
      participants: true,
      _count: {
        select: {
          participants: true,
          slots: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return schedules
}

export default async function SchedulesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/')
  }

  const schedules = await getSchedules(session.user.email)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">スケジュール一覧</h1>
          <p className="mt-2 text-gray-600">作成したスケジュールを管理できます</p>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              スケジュールがありません
            </h3>
            <p className="mt-2 text-gray-500">
              新しいスケジュールを作成して、シフト管理を始めましょう
            </p>
            <Link
              href="/schedules/new"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規スケジュール作成
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule) => (
              <Link
                key={schedule.id}
                href={`/schedules/${schedule.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {schedule.title}
                  </h2>
                  {schedule.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {schedule.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {schedule._count.slots} 枠
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {schedule._count.participants} 人
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      作成日: {new Date(schedule.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}