'use client'

interface Participant {
  id: string
  name: string
  email: string
  note?: string | null
  createdAt: Date
  availabilities: Array<{
    slot: {
      id: string
      startsAt: Date
      endsAt: Date
    }
  }>
  assignments: Array<{
    slot: {
      id: string
      startsAt: Date
      endsAt: Date
    }
  }>
}

interface ParticipantsListProps {
  participants: Participant[]
}

export default function ParticipantsList({ participants }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">参加者</h2>
        <p className="text-gray-500">まだ参加者がいません</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        参加者 ({participants.length}人)
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メール
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                応募枠数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                確定枠数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                備考
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {participant.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {participant.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {participant.availabilities.length}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {participant.assignments.length}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {participant.note || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(participant.createdAt).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}