'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import QRCodeGenerator from './QRCodeGenerator'
import ParticipantsList from './ParticipantsList'
import CopyButton from '@/app/components/CopyButton'
import AssignmentManager from './AssignmentManager'

async function getSchedule(id: string, userEmail: string) {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id,
      ownerUser: {
        email: userEmail
      }
    },
    include: {
      slots: {
        orderBy: {
          startsAt: 'asc'
        },
        include: {
          availabilities: {
            include: {
              participant: true
            }
          },
          assignments: {
            include: {
              participant: true
            }
          }
        }
      },
      participants: {
        include: {
          availabilities: {
            include: {
              slot: true
            }
          },
          assignments: {
            include: {
              slot: true
            }
          }
        }
      }
    }
  })
  return schedule
}

export default async function ScheduleDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/')
  }

  const schedule = await getSchedule(params.id, session.user.email)

  if (!schedule) {
    notFound()
  }

  const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${schedule.id}`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/schedules"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{schedule.title}</h1>
                {schedule.description && (
                  <p className="mt-2 text-gray-600">{schedule.description}</p>
                )}
              </div>
              <Link
                href={`/schedules/${schedule.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                編集
              </Link>
            </div>
          </div>

          <div className="p-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* 候補枠一覧 */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">候補枠</h2>
                {schedule.slots.length === 0 ? (
                  <p className="text-gray-500">候補枠が登録されていません</p>
                ) : (
                  <div className="space-y-3">
                    {schedule.slots.map((slot) => {
                      const startDate = new Date(slot.startsAt)
                      const endDate = new Date(slot.endsAt)
                      const availableCount = slot.availabilities.length
                      const assignedCount = slot.assignments.length
                      
                      return (
                        <div key={slot.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {startDate.toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {startDate.toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {' - '}
                                {endDate.toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                必要人数: {slot.capacity}人
                              </p>
                              <p className="text-sm">
                                <span className="text-green-600 font-medium">
                                  応募: {availableCount}人
                                </span>
                                {' / '}
                                <span className="text-blue-600 font-medium">
                                  確定: {assignedCount}人
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          {slot.availabilities.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-2">応募者:</p>
                              <div className="flex flex-wrap gap-2">
                                {slot.availabilities.map((availability) => (
                                  <span
                                    key={availability.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {availability.participant.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 割り当て管理 */}
              <AssignmentManager 
                scheduleId={schedule.id}
                participants={schedule.participants}
                slots={schedule.slots}
              />

              {/* 参加者一覧 */}
              <ParticipantsList participants={schedule.participants} />
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 公開URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">公開URL</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={publicUrl}
                      readOnly
                      className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1.5"
                    />
                    <CopyButton text={publicUrl} />
                  </div>
                  <QRCodeGenerator url={publicUrl} />
                  <Link
                    href={`/s/${schedule.id}`}
                    target="_blank"
                    className="block text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    公開ページをプレビュー →
                  </Link>
                </div>
              </div>

              {/* 統計情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">統計</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">候補枠数</dt>
                    <dd className="text-sm font-medium text-gray-900">{schedule.slots.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">参加者数</dt>
                    <dd className="text-sm font-medium text-gray-900">{schedule.participants.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">作成日</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(schedule.createdAt).toLocaleDateString('ja-JP')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}