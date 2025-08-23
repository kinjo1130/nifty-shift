'use client'

import { useState, useEffect } from 'react'

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
}

interface Participant {
  id: string
  name: string
  email: string
  note?: string | null
  availabilities: Array<{
    slot: Slot
  }>
}

interface EditParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  participant: Participant
  allSlots: Slot[]
  scheduleId: string
  onUpdateComplete: () => void
}

export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  allSlots,
  scheduleId,
  onUpdateComplete
}: EditParticipantModalProps) {
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedSlotIds(participant.availabilities.map(a => a.slot.id))
    }
  }, [isOpen, participant])

  if (!isOpen) return null

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlotIds(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    )
  }

  const handleUpdate = async () => {
    if (selectedSlotIds.length === 0) {
      alert('少なくとも1つの応募枠を選択してください')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/participants/${participant.id}/availabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIds: selectedSlotIds
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Update failed')
      }

      alert(`${participant.name}さんの応募枠を更新しました`)
      onUpdateComplete()
      onClose()
    } catch (error) {
      console.error('Update participant availabilities error:', error)
      alert('応募枠の更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            応募枠の編集
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

        {/* 参加者情報 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {participant.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{participant.name}</p>
              <p className="text-sm text-gray-500">{participant.email}</p>
              {participant.note && (
                <p className="text-xs text-gray-500 mt-1">備考: {participant.note}</p>
              )}
            </div>
          </div>
        </div>

        {/* 応募枠選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            応募可能な日時を選択
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allSlots.map((slot) => {
              const startDate = new Date(slot.startsAt)
              const endDate = new Date(slot.endsAt)
              const isSelected = selectedSlotIds.includes(slot.id)
              
              return (
                <label
                  key={slot.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSlotToggle(slot.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {startDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {startDate.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {endDate.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* 統計 */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">
              現在の応募枠数: {participant.availabilities.length}
            </span>
            <span className="text-blue-700">
              更新後の応募枠数: {selectedSlotIds.length}
            </span>
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating || selectedSlotIds.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? '更新中...' : '応募枠を更新'}
          </button>
        </div>
      </div>
    </div>
  )
}