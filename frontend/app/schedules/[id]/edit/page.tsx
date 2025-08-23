import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import EditScheduleForm from './EditScheduleForm'

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
        }
      }
    }
  })
  return schedule
}

export default async function EditSchedulePage({
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/schedules/${schedule.id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </Link>
        </div>

        <EditScheduleForm schedule={schedule} />
      </div>
    </div>
  )
}