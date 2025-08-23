import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// スケジュール一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    
    // ログインユーザーの場合は自分のスケジュールのみ取得
    const schedules = await prisma.schedule.findMany({
      where: session?.user?.email ? {
        ownerUser: {
          email: session.user.email
        }
      } : undefined,
      include: {
        slots: true,
        participants: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

// スケジュール作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const schedule = await prisma.schedule.create({
      data: {
        title: body.title,
        description: body.description,
        ownerUser: session?.user?.email ? {
          connect: {
            email: session.user.email
          }
        } : undefined,
      },
    })
    
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}