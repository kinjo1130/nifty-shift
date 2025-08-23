import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// 自動割り当てアルゴリズム
export async function POST(
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
      },
      include: {
        slots: {
          include: {
            availabilities: {
              include: {
                participant: true
              }
            },
            assignments: true
          }
        },
        participants: {
          include: {
            availabilities: true
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // 既存の割り当てを全削除
    await prisma.assignment.deleteMany({
      where: { scheduleId: params.id }
    })

    let assignedCount = 0
    const assignedParticipants = new Set<string>()

    // 貪欲法による自動割り当て
    // 1. 応募枠が少ない参加者から優先的に割り当て
    const participantPriorities = schedule.participants.map(participant => ({
      ...participant,
      availabilityCount: participant.availabilities.length
    })).sort((a, b) => a.availabilityCount - b.availabilityCount) // 応募枠が少ない順

    for (const participant of participantPriorities) {
      if (assignedParticipants.has(participant.id)) continue

      // この参加者が応募可能な枠を取得
      const availableSlots = participant.availabilities
        .map(a => schedule.slots.find(s => s.id === a.slotId))
        .filter(Boolean)
        .map(slot => ({
          ...slot!,
          currentAssignments: 0 // 現在の割り当て数を計算
        }))

      // 各枠の現在の割り当て数を計算
      for (const slot of availableSlots) {
        const assignments = await prisma.assignment.count({
          where: {
            scheduleId: params.id,
            slotId: slot.id
          }
        })
        slot.currentAssignments = assignments
      }

      // まだ空きがある枠から、最も埋まりにくい枠（応募者が少ない枠）を選択
      const availableSlotsWithCapacity = availableSlots
        .filter(slot => slot.currentAssignments < slot.capacity)
        .sort((a, b) => {
          // 1. 空き枠の割合で比較（空きが多い方を優先）
          const aRatio = (a.capacity - a.currentAssignments) / a.capacity
          const bRatio = (b.capacity - b.currentAssignments) / b.capacity
          if (aRatio !== bRatio) return bRatio - aRatio

          // 2. 応募者数で比較（応募者が少ない枠を優先）
          const aApplicants = schedule.slots.find(s => s.id === a.id)?.availabilities.length || 0
          const bApplicants = schedule.slots.find(s => s.id === b.id)?.availabilities.length || 0
          return aApplicants - bApplicants
        })

      // 最適な枠があれば割り当て
      if (availableSlotsWithCapacity.length > 0) {
        const selectedSlot = availableSlotsWithCapacity[0]
        
        await prisma.assignment.create({
          data: {
            scheduleId: params.id,
            slotId: selectedSlot.id,
            participantId: participant.id
          }
        })
        assignedParticipants.add(participant.id)
        assignedCount++
      }
    }

    const unassignedCount = schedule.participants.length - assignedParticipants.size

    return NextResponse.json({
      assigned: assignedParticipants.size,
      unassigned: unassignedCount,
      totalParticipants: schedule.participants.length
    })
  } catch (error) {
    console.error('Auto assignment failed:', error)
    return NextResponse.json({ error: 'Auto assignment failed' }, { status: 500 })
  }
}