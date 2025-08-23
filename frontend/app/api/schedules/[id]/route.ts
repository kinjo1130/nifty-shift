import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// スケジュール更新
export async function PUT(
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
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: params.id,
        ownerUser: {
          email: session.user.email
        }
      }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const schedule = await prisma.schedule.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description || null
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to update schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

// スケジュール削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // スケジュールの所有者確認
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: params.id,
        ownerUser: {
          email: session.user.email
        }
      }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    await prisma.schedule.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}