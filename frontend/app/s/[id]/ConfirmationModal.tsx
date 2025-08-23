'use client'

import { useState } from 'react'

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
}

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  formData: {
    name: string
    email: string
    note: string
  }
  selectedSlots: Slot[]
  onConfirm: () => void
  isSubmitting: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  formData,
  selectedSlots,
  onConfirm,
  isSubmitting
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            入力内容をご確認ください
          </h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <dt className="text-sm text-gray-600">選択日程:</dt>
            <dd className="font-medium text-gray-900">{selectedSlots.length}件</dd>
          </div>
          
          <div>
            <dt className="text-sm text-gray-600">お名前:</dt>
            <dd className="font-medium text-gray-900">{formData.name}</dd>
          </div>
          
          <div>
            <dt className="text-sm text-gray-600">メール:</dt>
            <dd className="font-medium text-gray-900">{formData.email}</dd>
          </div>
          
          {formData.note && (
            <div>
              <dt className="text-sm text-gray-600">備考:</dt>
              <dd className="font-medium text-gray-900">{formData.note}</dd>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">重複応募について</span>
          </div>
          <p className="text-sm text-yellow-700">
            同じメールアドレスで再度応募した場合、以前の応募内容が上書きされます。
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            ← 戻る
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : '応募を送信✓'}
          </button>
        </div>
      </div>
    </div>
  )
}