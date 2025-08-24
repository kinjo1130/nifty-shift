'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ManualAssignmentModal from './ManualAssignmentModal'

interface Participant {
  id: string
  name: string
  email: string
  availabilities: Array<{
    slotId: string
  }>
}

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
  assignments: Array<{
    participant: {
      id: string
      name: string
      email: string
    }
  }>
}

interface AssignmentManagerProps {
  scheduleId: string
  participants: Participant[]
  slots: Slot[]
}

export default function AssignmentManager({ scheduleId, participants, slots }: AssignmentManagerProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualAssignmentModal, setManualAssignmentModal] = useState<{
    isOpen: boolean
    participant?: Participant
  }>({ isOpen: false })

  // 自動割り当て実行
  const handleAutoAssignment = async () => {
    if (!confirm('自動割り当てを実行しますか？既存の割り当ては上書きされます。')) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/auto-assign`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Auto assignment failed')
      }

      const result = await response.json()
      alert(`自動割り当てが完了しました。\n成功: ${result.assigned}人\n未割り当て: ${result.unassigned}人`)
      router.refresh()
    } catch (error) {
      console.error('Auto assignment error:', error)
      alert('自動割り当てに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  // 全割り当てクリア
  const handleClearAllAssignments = async () => {
    if (!confirm('すべての割り当てをクリアしますか？この操作は取り消せません。')) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/assignments`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Clear assignments failed')
      }

      alert('すべての割り当てをクリアしました')
      router.refresh()
    } catch (error) {
      console.error('Clear assignments error:', error)
      alert('割り当てのクリアに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  // 統計計算
  const totalAssigned = slots.reduce((sum, slot) => sum + slot.assignments.length, 0)
  const totalCapacity = slots.reduce((sum, slot) => sum + slot.capacity, 0)
  const assignmentRate = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0

  // 未割り当て参加者を取得
  const assignedParticipantIds = new Set(
    slots.flatMap(slot => slot.assignments.map(a => a.participant.id))
  )
  const unassignedParticipants = participants.filter(p => !assignedParticipantIds.has(p.id))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">割り当て管理</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAllAssignments}
            disabled={isProcessing}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-md disabled:opacity-50"
          >
            全クリア
          </button>
          <button
            onClick={handleAutoAssignment}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '処理中...' : '🤖 自動割り当て実行'}
          </button>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">割り当て成功</p>
          <p className="text-2xl font-bold text-green-900">
            {assignmentRate}%
            <span className="text-sm font-normal ml-2">
              ({totalAssigned}/{totalCapacity})
            </span>
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">未割り当て</p>
          <p className="text-2xl font-bold text-red-900">
            {unassignedParticipants.length}名
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">総参加者</p>
          <p className="text-2xl font-bold text-blue-900">
            {participants.length}名
          </p>
        </div>
      </div>

      {/* 確定枠一覧 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">確定枠一覧</h3>
        {slots.map((slot) => {
          const startDate = new Date(slot.startsAt)
          const endDate = new Date(slot.endsAt)
          const remainingCapacity = slot.capacity - slot.assignments.length
          const isComplete = remainingCapacity === 0
          const isOverCapacity = slot.assignments.length > slot.capacity
          
          return (
            <div
              key={slot.id}
              className={`border rounded-lg p-4 ${
                isOverCapacity ? 'border-red-300 bg-red-50' : 
                isComplete ? 'border-green-300 bg-green-50' : 
                'border-orange-300 bg-orange-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {startDate.toLocaleDateString('ja-JP', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                    {' '}
                    {startDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    -
                    {endDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </h4>
                  <p className="text-sm text-gray-600">
                    定員: {slot.capacity}名
                  </p>
                </div>
                <div className="text-right">
                  {isOverCapacity ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ⚠️ 超過: +{slot.assignments.length - slot.capacity}名
                    </span>
                  ) : isComplete ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ 満員
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      📋 残り{remainingCapacity}名
                    </span>
                  )}
                </div>
              </div>
              
              {slot.assignments.length > 0 ? (
                <div className="space-y-2">
                  {slot.assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {assignment.participant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{assignment.participant.name}</p>
                          <p className="text-xs text-gray-500">{assignment.participant.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`${assignment.participant.name}さんの割り当てを解除しますか？`)) return
                          
                          try {
                            const response = await fetch(`/api/schedules/${scheduleId}/assignments/manual?participantId=${assignment.participant.id}&slotId=${slot.id}`, {
                              method: 'DELETE'
                            })
                            if (response.ok) {
                              router.refresh()
                            } else {
                              alert('割り当て解除に失敗しました')
                            }
                          } catch (error) {
                            console.error('Remove assignment error:', error)
                            alert('割り当て解除に失敗しました')
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="割り当て解除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">まだ割り当てられていません</p>
              )}
            </div>
          )
        })}
      </div>

      {/* 未割り当て参加者 */}
      {unassignedParticipants.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-900 mb-3">
            ⚠️ 未割り当て参加者 ({unassignedParticipants.length}名)
          </h3>
          <div className="text-sm text-red-700 mb-2">
            自動割り当てで割り当てすることできなかった応募者
          </div>
          <div className="space-y-2">
            {unassignedParticipants.map(participant => (
              <div key={participant.id} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {participant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{participant.name}</p>
                    <p className="text-xs text-gray-500">{participant.email}</p>
                    <p className="text-xs text-gray-500">
                      候補枠: {participant.availabilities.length}個
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setManualAssignmentModal({ 
                    isOpen: true, 
                    participant 
                  })}
                  className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 rounded"
                >
                  手動割り当て
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 手動割り当てモーダル */}
      {manualAssignmentModal.participant && (
        <ManualAssignmentModal
          isOpen={manualAssignmentModal.isOpen}
          onClose={() => setManualAssignmentModal({ isOpen: false })}
          participant={manualAssignmentModal.participant}
          availableSlots={slots.filter(slot => 
            slot.assignments.length < slot.capacity // 空きがある枠のみ
          )}
          scheduleId={scheduleId}
          onAssignmentComplete={() => {
            router.refresh()
            setManualAssignmentModal({ isOpen: false })
          }}
        />
      )}
    </div>
  )
}