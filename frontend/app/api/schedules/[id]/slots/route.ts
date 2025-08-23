import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// スロット作成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // スケジュールの所有者確認
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: params.id,
        ownerUser: {
          email: session.user.email
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const slot = await prisma.slot.create({
      data: {
        scheduleId: params.id,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        capacity: body.capacity || 1
      }
    })

    return NextResponse.json(slot)
  } catch (error) {
    console.error('Failed to create slot:', error)
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 })
  }
}