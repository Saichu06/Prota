import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Check,
  X,
  Edit3,
  AlertCircle,
  Trash2,
  Upload,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { formatDate } from '../../../lib/date-utils'
import { ApiError } from '../../../lib/api-client'

export function ProfilePage() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth()
  const { success, error: toastError } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Avatar state
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up preview object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Reset form when user changes or edit mode toggles
  const handleStartEdit = () => {
    setFullName(user?.fullName || '')
    setError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFullName(user?.fullName || '')
    setError(null)
    setIsEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Full name cannot be blank')
      return
    }
    if (fullName.trim().length > 100) {
      setError('Full name cannot exceed 100 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await updateProfile({ fullName: fullName.trim() })
      success('Profile name updated successfully!')
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.getFieldError('fullName') || err.message || 'Failed to update profile')
      } else {
        setError('Network error while saving profile')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, and WebP images are supported.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // 2MB Limit
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setAvatarError('Image file size must not exceed 2MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Generate local preview
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewFile(null)
    setPreviewUrl(null)
    setAvatarError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveAvatar = async () => {
    if (!previewFile) return
    setIsUploadingAvatar(true)
    setAvatarError(null)

    try {
      await uploadAvatar(previewFile)
      success('Profile picture updated successfully!')
      handleCancelPreview()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload profile picture'
      setAvatarError(msg)
      toastError(msg)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true)
    setAvatarError(null)

    try {
      await removeAvatar()
      success('Profile picture removed.')
      handleCancelPreview()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove profile picture'
      setAvatarError(msg)
      toastError(msg)
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  if (!user) {
    return null
  }

  const userInitial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U'
  const displayImage = previewUrl || user.profilePictureUrl

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, profile picture, and view account security.
        </p>
      </div>

      {/* Main Profile Card */}
      <Card variant="elevated" padding="lg">
        {/* Avatar & High Level Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar display with overlay upload trigger */}
            <div className="relative group shrink-0">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={`${user.fullName} avatar`}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
                  {userInitial}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Upload profile picture"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {user.fullName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={user.status === 'ACTIVE' ? 'green' : 'amber'}>
                  <ShieldCheck className="w-3 h-3" />
                  {user.status}
                </Badge>
                {user.emailVerifiedAt ? (
                  <Badge variant="blue">Email Verified</Badge>
                ) : (
                  <Badge variant="slate">Verification Pending</Badge>
                )}
              </div>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit Name
            </Button>
          )}
        </div>

        {/* ─── Profile Picture Actions & Preview ─── */}
        <div className="py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Profile Photo
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                PNG, JPEG, or WebP up to 2MB. Square ratio recommended.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {previewFile ? (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAvatar}
                    isLoading={isUploadingAvatar}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelPreview}
                    disabled={isUploadingAvatar}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    {user.profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {user.profilePictureUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      isLoading={isRemovingAvatar}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {avatarError && (
            <div
              role="alert"
              className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{avatarError}</span>
            </div>
          )}
        </div>

        {/* Profile Information & Edit Form */}
        <div className="pt-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={error || undefined}
                required
                autoFocus
                disabled={isSubmitting}
                leftIcon={<User className="w-4 h-4" />}
                helperText="This name appears in your dashboard greeting and reports."
              />

              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Block */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Full Name
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {user.fullName}
                </p>
              </div>

              {/* Email Block (Read Only) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email Address
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Read-only
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Registered Date */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Member Since
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Account Security Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Session Protection
                </span>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  HTTP-Only Cookie Authenticated
                </p>
              </div>
            </div>
          )}

          {/* Read-Only Notice Note */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Email addresses are currently locked to protect account ownership. Email changing and verification workflows will be introduced in an upcoming security release.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
