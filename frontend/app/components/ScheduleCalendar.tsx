'use client'

import { useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'

interface TimeSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  isNew?: boolean
}

interface ScheduleCalendarProps {
  slots: TimeSlot[]
  onSlotsChange: (slots: TimeSlot[]) => void
  mode?: 'create' | 'edit'
  existingSlots?: TimeSlot[]
}

export default function ScheduleCalendar({ 
  slots, 
  onSlotsChange,
  mode = 'create',
  existingSlots = []
}: ScheduleCalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showCapacityModal, setShowCapacityModal] = useState(false)
  const [tempCapacity, setTempCapacity] = useState(1)

  const events: EventInput[] = slots.map(slot => ({
    id: slot.id,
    title: `募集人数: ${slot.capacity}人`,
    start: `${slot.date}T${slot.startTime}`,
    end: `${slot.date}T${slot.endTime}`,
    backgroundColor: slot.isNew ? '#10b981' : '#3b82f6',
    borderColor: slot.isNew ? '#059669' : '#2563eb',
    extendedProps: {
      capacity: slot.capacity,
      isNew: slot.isNew
    }
  }))

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const newSlot: TimeSlot = {
      id: mode === 'edit' ? `new-${Date.now()}` : Date.now().toString(),
      date: selectInfo.start.toISOString().split('T')[0],
      startTime: selectInfo.start.toTimeString().slice(0, 5),
      endTime: selectInfo.end.toTimeString().slice(0, 5),
      capacity: 1,
      isNew: mode === 'edit'
    }
    
    setSelectedSlot(newSlot)
    setTempCapacity(1)
    setShowCapacityModal(true)
    selectInfo.view.calendar.unselect()
  }, [mode])

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const slot = slots.find(s => s.id === clickInfo.event.id)
    if (slot) {
      setSelectedSlot(slot)
      setTempCapacity(slot.capacity)
      setShowCapacityModal(true)
    }
  }, [slots])

  const handleCapacityConfirm = () => {
    if (selectedSlot) {
      const existingIndex = slots.findIndex(s => s.id === selectedSlot.id)
      if (existingIndex >= 0) {
        const updatedSlots = [...slots]
        updatedSlots[existingIndex] = { ...selectedSlot, capacity: tempCapacity }
        onSlotsChange(updatedSlots)
      } else {
        onSlotsChange([...slots, { ...selectedSlot, capacity: tempCapacity }])
      }
    }
    setShowCapacityModal(false)
    setSelectedSlot(null)
  }

  const handleSlotDelete = () => {
    if (selectedSlot) {
      onSlotsChange(slots.filter(s => s.id !== selectedSlot.id))
    }
    setShowCapacityModal(false)
    setSelectedSlot(null)
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            カレンダーで候補枠を選択
          </h3>
          <p className="text-sm text-gray-600">
            カレンダー上でドラッグして時間帯を選択してください。
            既存の枠をクリックすると編集・削除できます。
          </p>
          {mode === 'edit' && (
            <div className="mt-2 flex gap-4 text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded mr-1"></span>
                既存の枠
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded mr-1"></span>
                新規追加
              </span>
            </div>
          )}
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView='timeGridWeek'
          editable={false}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          events={events}
          eventClick={handleEventClick}
          locale='ja'
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '18:00'
          }}
          slotMinTime='06:00'
          slotMaxTime='22:00'
          slotDuration='00:30:00'
          height='auto'
          dayMaxEvents={true}
          weekends={true}
          buttonText={{
            today: '今日',
            month: '月',
            week: '週',
            day: '日'
          }}
        />
      </div>

      {showCapacityModal && selectedSlot && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              候補枠の設定
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  日時
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(`${selectedSlot.date}T${selectedSlot.startTime}`).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  〜
                  {new Date(`${selectedSlot.date}T${selectedSlot.endTime}`).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  必要人数
                </label>
                <input
                  type="number"
                  id="capacity"
                  min="1"
                  value={tempCapacity}
                  onChange={(e) => setTempCapacity(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleSlotDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                削除
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCapacityModal(false)
                    setSelectedSlot(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleCapacityConfirm}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}