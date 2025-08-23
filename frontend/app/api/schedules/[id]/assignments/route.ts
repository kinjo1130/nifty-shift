import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// 全割り当てクリア
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

    // すべての割り当てを削除
    const result = await prisma.assignment.deleteMany({
      where: { scheduleId: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Clear assignments failed:', error)
    return NextResponse.json({ error: 'Clear assignments failed' }, { status: 500 })
  }
}