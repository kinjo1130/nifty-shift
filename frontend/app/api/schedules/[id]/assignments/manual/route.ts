import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// 手動割り当て
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
    const { participantId, slotId } = body

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

    // 参加者がその枠に応募しているかチェック
    const availability = await prisma.availability.findFirst({
      where: {
        scheduleId: params.id,
        participantId,
        slotId
      }
    })

    if (!availability) {
      return NextResponse.json({ 
        error: 'この参加者はこの枠に応募していません' 
      }, { status: 400 })
    }

    // 既に割り当て済みかチェック
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        scheduleId: params.id,
        participantId
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'この参加者は既に他の枠に割り当て済みです' 
      }, { status: 400 })
    }

    // 手動割り当てを作成
    const assignment = await prisma.assignment.create({
      data: {
        scheduleId: params.id,
        slotId,
        participantId
      },
      include: {
        participant: true,
        slot: true
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Manual assignment failed:', error)
    return NextResponse.json({ error: 'Manual assignment failed' }, { status: 500 })
  }
}

// 個別割り当て解除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')
    const slotId = searchParams.get('slotId')

    if (!participantId || !slotId) {
      return NextResponse.json({ 
        error: 'participantId and slotId are required' 
      }, { status: 400 })
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

    // 割り当てを削除
    const result = await prisma.assignment.deleteMany({
      where: {
        scheduleId: params.id,
        slotId,
        participantId
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Remove assignment failed:', error)
    return NextResponse.json({ error: 'Remove assignment failed' }, { status: 500 })
  }
}