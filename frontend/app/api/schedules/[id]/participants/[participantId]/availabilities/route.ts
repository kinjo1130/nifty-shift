import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, participantId: string } }
) {
  try {
    const { slotIds } = await request.json()
    const scheduleId = params.id
    const participantId = params.participantId

    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid slot IDs are required' },
        { status: 400 }
      )
    }

    // 参加者が存在するかチェック
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { schedule: true }
    })

    if (!participant || participant.scheduleId !== scheduleId) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // 指定されたslotがスケジュールに属するかチェック
    const slots = await prisma.slot.findMany({
      where: {
        id: { in: slotIds },
        scheduleId: scheduleId
      }
    })

    if (slots.length !== slotIds.length) {
      return NextResponse.json(
        { error: 'Invalid slot IDs provided' },
        { status: 400 }
      )
    }

    // 既存の応募枠を削除して新しい応募枠を作成（トランザクション）
    await prisma.$transaction(async (tx) => {
      // 既存の応募枠を削除
      await tx.availability.deleteMany({
        where: { participantId: participantId }
      })

      // 新しい応募枠を作成
      await tx.availability.createMany({
        data: slotIds.map((slotId: string) => ({
          participantId: participantId,
          slotId: slotId,
          scheduleId: scheduleId
        }))
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update participant availabilities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}