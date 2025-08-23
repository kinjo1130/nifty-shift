'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmationModal from './ConfirmationModal'
import CompletionModal from './CompletionModal'

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
  remainingCapacity: number
}

interface ParticipantFormProps {
  scheduleId: string
  slots: Slot[]
}

export default function ParticipantForm({ scheduleId, slots }: ParticipantFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    note: ''
  })
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    selectedSlots: Slot[]
  } | null>(null)

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedSlots.length === 0) {
      alert('参加可能な日時を選択してください')
      return
    }

    setShowConfirmation(true)
  }

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/schedules/${scheduleId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slotIds: selectedSlots
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to register')
      }

      // 成功時は完了画面を表示
      const selectedSlotObjects = slots.filter(slot => selectedSlots.includes(slot.id))
      setSubmissionResult({ selectedSlots: selectedSlotObjects })
      setShowConfirmation(false)
      setShowCompletion(true)
      
      // フォームをリセット
      setFormData({ name: '', email: '', note: '' })
      setSelectedSlots([])
      
      router.refresh()
    } catch (error) {
      console.error('Registration error:', error)
      alert('登録に失敗しました。もう一度お試しください。')
      setShowConfirmation(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableSlots = slots.filter(slot => slot.remainingCapacity > 0)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        参加登録
      </h2>

      {availableSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>現在、参加可能な枠がありません</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="全員参加でお願いします。"
              />
            </div>
          </div>

          {/* 参加可能日時選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              参加可能な日時を選択 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {availableSlots.map((slot) => {
                const startDate = new Date(slot.startsAt)
                const endDate = new Date(slot.endsAt)
                const isSelected = selectedSlots.includes(slot.id)
                
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
                    <div className="ml-3 flex-1">
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
                    <div className="text-sm text-gray-500">
                      残り {slot.remainingCapacity} 枠
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '登録する'}
            </button>
          </div>
        </form>
      )}

      {/* 確認モーダル */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        formData={formData}
        selectedSlots={slots.filter(slot => selectedSlots.includes(slot.id))}
        onConfirm={handleConfirmedSubmit}
        isSubmitting={isSubmitting}
      />

      {/* 完了モーダル */}
      {submissionResult && (
        <CompletionModal
          isOpen={showCompletion}
          onClose={() => {
            setShowCompletion(false)
            setSubmissionResult(null)
          }}
          formData={{ name: formData.name, email: formData.email }}
          selectedSlots={submissionResult.selectedSlots}
        />
      )}
    </div>
  )
}