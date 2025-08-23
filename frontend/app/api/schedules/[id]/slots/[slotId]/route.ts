import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth';

// スロット更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; slotId: string } }
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

    const slot = await prisma.slot.update({
      where: { id: params.slotId },
      data: {
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        capacity: body.capacity
      }
    })

    return NextResponse.json(slot)
  } catch (error) {
    console.error('Failed to update slot:', error)
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
  }
}

// スロット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slotId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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

    await prisma.slot.delete({
      where: { id: params.slotId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete slot:', error)
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
  }
}