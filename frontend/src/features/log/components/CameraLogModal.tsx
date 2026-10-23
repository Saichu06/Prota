import { useState, useRef, useId } from 'react'
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { foodLogService } from '../services/foodLogService'
import { Button } from '../../../components/ui/Button'
import { NutritionReviewDraft } from './NutritionReviewDraft'
import type { MealType, AiFoodItemDto, CreateFoodEntryRequest } from '../../../types/api'

interface CameraLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDate: string
  onSwitchToManual: (prefill?: Partial<CreateFoodEntryRequest>) => void
}

export function CameraLogModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  onSwitchToManual,
}: CameraLogModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // AI Estimation State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const [estimatedItems, setEstimatedItems] = useState<AiFoodItemDto[]>([])
  const [estimateId, setEstimateId] = useState<string | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Accessibility IDs
  const fileInputId = useId()

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const handleClose = () => {
    stopCameraStream()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setEstimatedItems([])
    setEstimateId(null)
    setEstimateError(null)
    setAiUnavailable(false)
    onClose()
  }

  const startCamera = async () => {
    setCameraError(null)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please upload an image file instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setIsCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError('Camera permission denied or camera device is busy. Please upload an image file instead.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-food-${Date.now()}.jpg`, { type: 'image/jpeg' })
          handleFileSelected(file)
          stopCameraStream()
        }
      }, 'image/jpeg', 0.85)
    }
  }

  const handleFileSelected = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setEstimateError('Only JPG, PNG, and WebP image formats are supported.')
      return
    }

    // Validate size (8MB)
    if (file.size > 8 * 1024 * 1024) {
      setEstimateError('Image size exceeds the 8MB limit. Please choose a smaller photo.')
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setEstimateError(null)
    setEstimatedItems([])
    setEstimateId(null)
    setAiUnavailable(false)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setEstimateError(null)
    setAiUnavailable(false)

    try {
      const res = await foodLogService.estimateFromImage(selectedFile)

      if (res.status === 'UNAVAILABLE' || res.errorCode === 'AI_NOT_CONFIGURED') {
        setAiUnavailable(true)
        setEstimateError(res.message || 'AI nutrition estimation is currently unavailable because Gemini is not configured.')
      } else if (res.status === 'SUCCESS' && res.items && res.items.length > 0) {
        setEstimatedItems(res.items)
        setEstimateId(res.estimateId || null)
        if (res.items[0]?.mealType) {
          setSelectedMealType(res.items[0].mealType)
        }
      } else {
        setEstimateError(res.message || 'Could not recognize food items from this photo. Please enter manually.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis request failed.'
      setEstimateError(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className={`relative w-full ${
          estimatedItems.length > 0 ? 'max-w-2xl' : 'max-w-xl'
        } my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="camera-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Camera / Photo Assist
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Capture meal photo for assisted nutrition breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* AI Boundary Notice when unconfigured */}
          {aiUnavailable && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-medium">
                  <strong>Integration Notice:</strong> AI vision analysis requires a server-side Gemini API key (<code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-sm">GEMINI_API_KEY</code>). Because it is not set on this server, image estimation cannot be run automatically.
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleClose()
                    onSwitchToManual()
                  }}
                >
                  Log Manually Instead
                </Button>
              </div>
            </div>
          )}

          {estimateError && !aiUnavailable && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{estimateError}</span>
            </div>
          )}

          {cameraError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Active Camera View */}
          {isCameraActive && (
            <div className="space-y-3">
              <div className="relative aspect-4/3 bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={stopCameraStream}>
                  Cancel Camera
                </Button>
                <Button variant="primary" size="sm" onClick={capturePhoto}>
                  <Camera className="w-4 h-4 mr-1.5" />
                  Capture Photo
                </Button>
              </div>
            </div>
          )}

          {/* Image Preview & Actions (shown before analysis) */}
          {!isCameraActive && previewUrl && estimatedItems.length === 0 && (
            <div className="space-y-4">
              <div className="relative aspect-4/3 max-h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Captured food preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setEstimatedItems([])
                    setEstimateId(null)
                  }}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retake / Change Image
                </Button>

                {!aiUnavailable && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing with Gemini...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Analyze Food
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload or Camera Launcher when no image is chosen and no draft active */}
          {!isCameraActive && !previewUrl && estimatedItems.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 group"
              >
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Use Device Camera
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Snap a fresh photo of your dish
                  </div>
                </div>
              </button>

              <label
                htmlFor={fileInputId}
                className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 group cursor-pointer"
              >
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Upload Food Image
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select a JPEG, PNG, or WebP (max 8MB)
                  </div>
                </div>
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelected(file)
                  }}
                />
              </label>
            </div>
          )}

          {/* ─── DRAFT REVIEW & CONFIRMATION SECTION ─── */}
          {estimatedItems.length > 0 && (
            <div className="space-y-4">
              {/* Thumbnail of analyzed image */}
              {previewUrl && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                    <img
                      src={previewUrl}
                      alt="Analyzed meal thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedFile?.name || 'Meal Photo'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Photo analyzed by Gemini. Review nutrition estimates below.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEstimatedItems([])
                      setEstimateId(null)
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              )}

              <NutritionReviewDraft
                estimateId={estimateId}
                initialItems={estimatedItems}
                defaultDate={defaultDate}
                defaultMealType={selectedMealType}
                sourceLabel="Camera Photo Analysis"
                onSaveSuccess={() => {
                  onSuccess()
                  handleClose()
                }}
                onCancel={() => {
                  setEstimatedItems([])
                  setEstimateId(null)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
