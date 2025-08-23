import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ParticipantForm from './ParticipantForm'

async function getPublicSchedule(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
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
          _count: {
            select: {
              assignments: true
            }
          }
        }
      },
      ownerUser: {
        select: {
          name: true
        }
      }
    }
  })
  return schedule
}

export default async function PublicSchedulePage({
  params
}: {
  params: { id: string }
}) {
  const schedule = await getPublicSchedule(params.id)

  if (!schedule) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {schedule.title}
          </h1>
          {schedule.description && (
            <p className="text-gray-600 mb-4">{schedule.description}</p>
          )}
          {schedule.ownerUser?.name && (
            <p className="text-sm text-gray-500">
              作成者: {schedule.ownerUser.name}
            </p>
          )}
        </div>

        {/* 候補日時一覧 */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            候補日時
          </h2>
          {schedule.slots.length === 0 ? (
            <p className="text-gray-500">候補日時が設定されていません</p>
          ) : (
            <div className="space-y-3">
              {schedule.slots.map((slot) => {
                const startDate = new Date(slot.startsAt)
                const endDate = new Date(slot.endsAt)
                const remainingCapacity = slot.capacity - slot._count.assignments
                const isAvailable = remainingCapacity > 0
                
                return (
                  <div
                    key={slot.id}
                    className={`border rounded-lg p-4 ${
                      isAvailable ? 'border-gray-200' : 'border-red-200 bg-red-50'
                    }`}
                  >
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
                        <p className={`text-sm font-medium ${
                          isAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isAvailable ? `残り ${remainingCapacity} 枠` : '満員'}
                        </p>
                        <p className="text-xs text-gray-500">
                          必要人数: {slot.capacity}人
                        </p>
                      </div>
                    </div>
                    
                    {slot.availabilities.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">
                          応募者 ({slot.availabilities.length}人):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {slot.availabilities.map((availability) => (
                            <span
                              key={availability.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
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

        {/* 参加登録フォーム */}
        <ParticipantForm 
          scheduleId={schedule.id} 
          slots={schedule.slots.map(slot => ({
            id: slot.id,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            capacity: slot.capacity,
            remainingCapacity: slot.capacity - slot._count.assignments
          }))}
        />
      </div>
    </div>
  )
}