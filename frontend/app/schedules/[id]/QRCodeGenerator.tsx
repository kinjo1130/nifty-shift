'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
  url: string
}

export default function QRCodeGenerator({ url }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
      } catch (err) {
        console.error('QR Code generation failed:', err)
        setError('QRコードの生成に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    generateQR()
  }, [url])

  if (error) {
    return (
      <div className="flex justify-center">
        <div className="w-[150px] h-[150px] border border-gray-300 rounded flex items-center justify-center bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            QRコード生成<br />エラー
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded"
      />
    </div>
  )
}