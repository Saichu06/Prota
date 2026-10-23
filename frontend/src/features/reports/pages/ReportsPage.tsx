import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  FileDown,
  Download,
  Calendar,
  Sparkles,
  Dumbbell,
  Scale,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flame,
  Droplets,
  Layers,
  ChevronDown,
} from 'lucide-react'
import {
  reportService,
  type ReportType,
  type CsvExportType,
  type ReportPreviewResponse,
} from '../services/reportService'

export function ReportsPage() {
  const todayStr = new Date().toISOString().substring(0, 10)

  // Report configuration state
  const [reportType, setReportType] = useState<ReportType>('DAILY_NUTRITION')
  const [startDate, setStartDate] = useState<string>(todayStr)
  const [endDate, setEndDate] = useState<string>(todayStr)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LBS'>('KG')
  const [includeDetails, setIncludeDetails] = useState<boolean>(true)

  // CSV dropdown open state
  const [csvMenuOpen, setCsvMenuOpen] = useState(false)

  // Preview & execution state
  const [preview, setPreview] = useState<ReportPreviewResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true)
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false)
  const [exportingCsv, setExportingCsv] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load preview data whenever report configuration changes
  const loadPreview = useCallback(async () => {
    setLoadingPreview(true)
    setErrorMessage(null)
    try {
      const data = await reportService.getPreview({
        type: reportType,
        from: startDate,
        to: endDate,
        planId: selectedPlanId || undefined,
      })
      setPreview(data)

      // Auto-select first plan if not yet set
      if (reportType === 'SAVED_DIET_PLAN' && data.availableDietPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data.availableDietPlans[0].id)
      } else if (reportType === 'SAVED_WORKOUT_PLAN' && data.availableWorkoutPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data.availableWorkoutPlans[0].id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load report preview'
      setErrorMessage(msg)
    } finally {
      setLoadingPreview(false)
    }
  }, [reportType, startDate, endDate, selectedPlanId])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  // Handle PDF Generation
  const handleDownloadPdf = async () => {
    setGeneratingPdf(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await reportService.downloadPdf({
        type: reportType,
        from: startDate,
        to: endDate,
        planId: selectedPlanId || undefined,
        weightUnit,
        includeDetails,
      })
      setSuccessMessage('PDF report generated and downloaded successfully.')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF report'
      setErrorMessage(msg)
    } finally {
      setGeneratingPdf(false)
    }
  }

  // Handle CSV Export
  const handleExportCsv = async (csvType: CsvExportType) => {
    setCsvMenuOpen(false)
    setExportingCsv(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await reportService.downloadCsv({
        type: csvType,
        from: startDate,
        to: endDate,
      })
      setSuccessMessage(`CSV archive (${csvType.replace('_', ' ').toLowerCase()}) downloaded successfully.`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export CSV'
      setErrorMessage(msg)
    } finally {
      setExportingCsv(false)
    }
  }

  // Quick report type selector items
  const reportTypes = [
    {
      id: 'DAILY_NUTRITION' as ReportType,
      label: 'Daily Nutrition',
      description: 'Single day macro breakdown, meals, goals & water',
      icon: Calendar,
    },
    {
      id: 'WEEKLY_NUTRITION' as ReportType,
      label: 'Weekly Nutrition',
      description: '7-day rolling intake, adherence & recorded averages',
      icon: Layers,
    },
    {
      id: 'MONTHLY_NUTRITION' as ReportType,
      label: 'Monthly Nutrition',
      description: '30-day macro progression & hydration trends',
      icon: Layers,
    },
    {
      id: 'CUSTOM_RANGE' as ReportType,
      label: 'Custom Date-Range',
      description: 'Flexible start and end dates with detailed entries',
      icon: Calendar,
    },
    {
      id: 'WEIGHT_PROGRESS' as ReportType,
      label: 'Weight Progress',
      description: 'Bodyweight measurements, net change & notes',
      icon: Scale,
    },
    {
      id: 'SAVED_DIET_PLAN' as ReportType,
      label: 'Saved Diet Plan',
      description: 'Export approved AI nutrition meal plan',
      icon: Sparkles,
    },
    {
      id: 'SAVED_WORKOUT_PLAN' as ReportType,
      label: 'Saved Workout Plan',
      description: 'Export approved AI workout split & routine',
      icon: Dumbbell,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ─── PAGE HEADER ─── */}
      <div>
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
          <FileText className="w-4 h-4" />
          <span>Documentation & Data Export</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Downloadable Reports
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl">
          Generate printable, server-certified PDF documents and RFC-compliant CSV archives
          from your persisted nutrition, hydration, weight, and workout records.
        </p>
      </div>

      {/* ─── FEEDBACK ALERTS ─── */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Unable to process request: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* ─── STEP 1: SELECT REPORT TYPE ─── */}
      <section aria-labelledby="report-type-heading" className="space-y-3">
        <h2 id="report-type-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          1. Select Report Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {reportTypes.map((item) => {
            const isSelected = reportType === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setReportType(item.id)
                  setSelectedPlanId('')
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  )}
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {item.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.description}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── STEP 2: FILTERS & PARAMETERS ─── */}
      <section
        aria-labelledby="report-filters-heading"
        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 id="report-filters-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Configure Parameters & Dates
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {reportType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Date Controls */}
        {reportType === 'DAILY_NUTRITION' && (
          <div className="max-w-xs">
            <label htmlFor="daily-date-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Selected Log Date
            </label>
            <input
              id="daily-date-input"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setEndDate(e.target.value)
              }}
              max={todayStr}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {(reportType === 'WEEKLY_NUTRITION' || reportType === 'MONTHLY_NUTRITION') && (
          <div className="max-w-xs">
            <label htmlFor="period-end-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Period Ending Date
            </label>
            <input
              id="period-end-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={todayStr}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {reportType === 'WEEKLY_NUTRITION' ? 'Includes the 7 days ending on this date.' : 'Includes the 30 days ending on this date.'}
            </p>
          </div>
        )}

        {(reportType === 'CUSTOM_RANGE' || reportType === 'WEIGHT_PROGRESS') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label htmlFor="range-start-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                id="range-start-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || todayStr}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="range-end-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Date
              </label>
              <input
                id="range-end-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={todayStr}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Saved Diet Plan Selector */}
        {reportType === 'SAVED_DIET_PLAN' && (
          <div className="max-w-md">
            <label htmlFor="diet-plan-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Saved Diet Plan
            </label>
            {preview?.availableDietPlans && preview.availableDietPlans.length > 0 ? (
              <select
                id="diet-plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {preview.availableDietPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.createdAt}) — {p.details}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                No saved diet plans found. Visit Add Ons &gt; AI Diet Planner to generate and save your personalized plan.
              </p>
            )}
          </div>
        )}

        {/* Saved Workout Plan Selector */}
        {reportType === 'SAVED_WORKOUT_PLAN' && (
          <div className="max-w-md">
            <label htmlFor="workout-plan-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Saved Workout Plan
            </label>
            {preview?.availableWorkoutPlans && preview.availableWorkoutPlans.length > 0 ? (
              <select
                id="workout-plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {preview.availableWorkoutPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.createdAt}) — {p.details}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                No saved workout plans found. Visit Add Ons &gt; AI Workout Planner to generate and save your routine.
              </p>
            )}
          </div>
        )}

        {/* Unit and Detail Options */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
          {reportType === 'WEIGHT_PROGRESS' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight Unit:</span>
              <button
                type="button"
                onClick={() => setWeightUnit('KG')}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  weightUnit === 'KG'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Kilograms (kg)
              </button>
              <button
                type="button"
                onClick={() => setWeightUnit('LBS')}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  weightUnit === 'LBS'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Pounds (lbs)
              </button>
            </div>
          )}

          {(reportType === 'CUSTOM_RANGE' || reportType === 'WEEKLY_NUTRITION' || reportType === 'MONTHLY_NUTRITION') && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Include itemized food log breakdown in document</span>
            </label>
          )}
        </div>
      </section>

      {/* ─── STEP 3: PRE-GENERATION LIVE CONTENT PREVIEW ─── */}
      <section
        aria-labelledby="report-preview-heading"
        className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 id="report-preview-heading" className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            3. Report Content Summary
          </h2>
          {loadingPreview && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing records...</span>
            </span>
          )}
        </div>

        {preview && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
              {preview.summaryMessage}
            </div>

            {/* Metrics cards if nutrition report */}
            {reportType !== 'SAVED_DIET_PLAN' && reportType !== 'SAVED_WORKOUT_PLAN' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Coverage</span>
                  </div>
                  <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {preview.recordedDays} of {preview.totalDays} days
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {preview.totalFoodEntries} logged entries
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Flame className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Avg Protein</span>
                  </div>
                  <div className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {preview.averageDailyProteinG} g
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Per recorded day
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Hydration</span>
                  </div>
                  <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {preview.totalHydrationMl > 0 ? `${preview.totalHydrationMl} ml` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Total recorded
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Weight Trend</span>
                  </div>
                  <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {preview.weightMeasurementsCount} logs
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={preview.weightTrendNote}>
                    {preview.weightTrendNote}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── STEP 4: DOWNLOAD ACTIONS ─── */}
      <section aria-label="Export Actions" className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf || (reportType === 'SAVED_DIET_PLAN' && !selectedPlanId) || (reportType === 'SAVED_WORKOUT_PLAN' && !selectedPlanId)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling Document...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>

          {/* CSV Export Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCsvMenuOpen((prev) => !prev)}
              disabled={exportingCsv}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {exportingCsv ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Raw CSV</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </>
              )}
            </button>

            {csvMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select CSV Dataset
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('FOOD_ENTRIES')}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Itemized Food Entries (RFC 4180)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('DAILY_SUMMARIES')}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Daily Macro Summaries
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('HYDRATION')}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Hydration Timestamp Logs
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv('WEIGHT')}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Weight Measurements
                </button>
              </div>
            )}
          </div>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
          Server-generated document streamed securely under current session credentials.
        </span>
      </section>
    </div>
  )
}
