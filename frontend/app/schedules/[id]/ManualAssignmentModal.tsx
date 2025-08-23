'use client'

import { useState } from 'react'

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
}

interface ManualAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  participant: Participant
  availableSlots: Slot[]
  scheduleId: string
  onAssignmentComplete: () => void
}

export default function ManualAssignmentModal({
  isOpen,
  onClose,
  participant,
  availableSlots,
  scheduleId,
  onAssignmentComplete
}: ManualAssignmentModalProps) {
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  if (!isOpen) return null

  const handleAssign = async () => {
    if (!selectedSlotId) {
      alert('割り当てる枠を選択してください')
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/assignments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          slotId: selectedSlotId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Assignment failed')
      }

      alert(`${participant.name}さんを選択された枠に割り当てました`)
      onAssignmentComplete()
      onClose()
    } catch (error) {
      console.error('Manual assignment error:', error)
      alert(`割り当てに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsAssigning(false)
    }
  }

  // 参加者が応募可能な枠のみフィルタリング
  const applicableSlots = availableSlots.filter(slot => 
    participant.availabilities.some(a => a.slotId === slot.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            手動割り当て
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {participant.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{participant.name}</p>
              <p className="text-sm text-gray-500">{participant.email}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            割り当てる枠を選択
          </label>
          
          {applicableSlots.length === 0 ? (
            <p className="text-gray-500 text-sm">
              この参加者が応募可能な枠で、まだ空きがある枠がありません
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {applicableSlots.map((slot) => {
                const startDate = new Date(slot.startsAt)
                const endDate = new Date(slot.endsAt)
                
                return (
                  <label
                    key={slot.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedSlotId === slot.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {startDate.toLocaleDateString('ja-JP', {
                          month: 'short',
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
                      </p>
                      <p className="text-xs text-gray-500">
                        定員: {slot.capacity}名
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isAssigning}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleAssign}
            disabled={isAssigning || !selectedSlotId || applicableSlots.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? '割り当て中...' : '割り当て実行'}
          </button>
        </div>
      </div>
    </div>
  )
}