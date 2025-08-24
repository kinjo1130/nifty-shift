'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const ScheduleCalendar = dynamic(
  () => import('@/app/components/ScheduleCalendar'),
  { ssr: false }
)

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
}

interface Schedule {
  id: string
  title: string
  description?: string | null
  slots: Slot[]
}

interface TimeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  isNew?: boolean
}

export default function EditScheduleForm({ schedule }: { schedule: Schedule }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(schedule.title)
  const [description, setDescription] = useState(schedule.description || '')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  
  // 既存のスロットを変換
  const [slots, setSlots] = useState<TimeSlot[]>(
    schedule.slots.map(slot => ({
      id: slot.id,
      date: new Date(slot.startsAt).toISOString().split('T')[0],
      startTime: new Date(slot.startsAt).toTimeString().slice(0, 5),
      endTime: new Date(slot.endsAt).toTimeString().slice(0, 5),
      capacity: slot.capacity
    }))
  )

  const originalSlots = schedule.slots.map(slot => ({
    id: slot.id,
    date: new Date(slot.startsAt).toISOString().split('T')[0],
    startTime: new Date(slot.startsAt).toTimeString().slice(0, 5),
    endTime: new Date(slot.endsAt).toTimeString().slice(0, 5),
    capacity: slot.capacity
  }))

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || slots.length === 0) {
      alert('タイトルと候補日時を入力してください')
      return
    }

    setIsSubmitting(true)

    try {
      // スケジュール更新
      const scheduleRes = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })

      if (!scheduleRes.ok) throw new Error('Failed to update schedule')

      // スロットの処理
      const newSlots = slots.filter(slot => slot.isNew)
      const existingSlots = slots.filter(slot => !slot.isNew)
      const deletedSlotIds = schedule.slots
        .filter(originalSlot => !existingSlots.find(slot => slot.id === originalSlot.id))
        .map(slot => slot.id)

      // 削除されたスロットを削除
      for (const slotId of deletedSlotIds) {
        await fetch(`/api/schedules/${schedule.id}/slots/${slotId}`, {
          method: 'DELETE'
        })
      }

      // 新しいスロットを作成
      for (const slot of newSlots) {
        const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`)
        const endDateTime = new Date(`${slot.date}T${slot.endTime}:00`)
        
        await fetch(`/api/schedules/${schedule.id}/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startsAt: startDateTime.toISOString(),
            endsAt: endDateTime.toISOString(),
            capacity: slot.capacity
          })
        })
      }

      // 既存のスロットを更新
      for (const slot of existingSlots) {
        const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`)
        const endDateTime = new Date(`${slot.date}T${slot.endTime}:00`)
        
        await fetch(`/api/schedules/${schedule.id}/slots/${slot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startsAt: startDateTime.toISOString(),
            endsAt: endDateTime.toISOString(),
            capacity: slot.capacity
          })
        })
      }

      router.push(`/schedules/${schedule.id}`)
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('スケジュールの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          スケジュール編集
        </h1>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            候補枠設定
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              カレンダー表示
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              リスト表示
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <ScheduleCalendar 
            slots={slots}
            onSlotsChange={setSlots}
            mode="edit"
            existingSlots={originalSlots}
          />
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => {
                  const newSlot: TimeSlot = {
                    id: `new-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '10:00',
                    capacity: 1,
                    isNew: true
                  }
                  setSlots([...slots, newSlot])
                }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                追加
              </button>
            </div>

            {slots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>候補日時が設定されていません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium text-gray-500 w-8">
                      {index + 1}
                    </span>
                    
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => {
                        setSlots(slots.map(s => 
                          s.id === slot.id ? { ...s, date: e.target.value } : s
                        ))
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => {
                        setSlots(slots.map(s => 
                          s.id === slot.id ? { ...s, startTime: e.target.value } : s
                        ))
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    
                    <span className="text-gray-500">〜</span>
                    
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => {
                        setSlots(slots.map(s => 
                          s.id === slot.id ? { ...s, endTime: e.target.value } : s
                        ))
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                      required
                    />
                    
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-gray-600">必要人数:</label>
                      <input
                        type="number"
                        min="1"
                        value={slot.capacity}
                        onChange={(e) => {
                          setSlots(slots.map(s => 
                            s.id === slot.id ? { ...s, capacity: parseInt(e.target.value) || 1 } : s
                          ))
                        }}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                    
                    {slot.isNew && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        新規
                      </span>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setSlots(slots.filter(s => s.id !== slot.id))}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '更新中...' : '更新する'}
        </button>
      </div>
    </form>
  )
}