import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 参加者登録
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, note, slotIds } = body

    // スケジュールの存在確認
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // 同じメールアドレスで既に登録されているかチェック
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        scheduleId: params.id,
        email: email
      }
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: '既に登録されています' }, 
        { status: 400 }
      )
    }

    // 参加者を作成
    const participant = await prisma.participant.create({
      data: {
        scheduleId: params.id,
        name,
        email,
        note: note || null
      }
    })

    // 選択された枠への応募を作成
    const availabilities = await Promise.all(
      slotIds.map((slotId: string) => 
        prisma.availability.create({
          data: {
            scheduleId: params.id,
            participantId: participant.id,
            slotId
          }
        })
      )
    )

    return NextResponse.json({
      participant,
      availabilities
    })
  } catch (error) {
    console.error('Failed to create participant:', error)
    return NextResponse.json(
      { error: 'Failed to register participant' }, 
      { status: 500 }
    )
  }
}