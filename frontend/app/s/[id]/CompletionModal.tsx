'use client'

interface Slot {
  id: string
  startsAt: Date
  endsAt: Date
}

interface CompletionModalProps {
  isOpen: boolean
  onClose: () => void
  formData: {
    name: string
    email: string
  }
  selectedSlots: Slot[]
}

export default function CompletionModal({
  isOpen,
  onClose,
  formData,
  selectedSlots
}: CompletionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="text-center">
          {/* 成功アイコン */}
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            応募が完了しました！
          </h2>
          
          <p className="text-gray-600 mb-1">
            ご応募ありがとうございます。
          </p>
          <p className="text-gray-600 mb-6">
            登録されたメールアドレスに確認メールをお送りしました。
          </p>

          {/* 応募内容 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-green-900 mb-3">応募内容</h3>
            <div className="space-y-2">
              {selectedSlots.map((slot, index) => {
                const startDate = new Date(slot.startsAt)
                const endDate = new Date(slot.endsAt)
                
                return (
                  <div key={slot.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-green-800">
                      {startDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric'
                      })}
                      {' '}
                      ({startDate.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      -
                      {endDate.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })})
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}