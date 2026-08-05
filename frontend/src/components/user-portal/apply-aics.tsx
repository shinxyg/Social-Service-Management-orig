import { useEffect, useRef, useState } from "react"
import { Camera, Clock, ClipboardList, ImagePlus, ScanFace, X, Loader2, RotateCcw } from "lucide-react"
import { PageHeader } from "../ui/shared"
import { useLanguage } from "../ui/language-context"

function generateReference() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `AICS-2026-${num}`
}

interface ApplyAICSProps {
  // When provided (e.g. resident clicked a specific assistance card like
  // "Medical Assistance"), the type is locked/fixed and shown as read-only
  // instead of a dropdown the user can change.
  initialType?: string
  // When provided, shows a "← Back" link above the form, matching the
  // same structure/spacing used in apply-pwd-senior.tsx / apply-solo-parent.tsx
  // (single container, single padding/max-width, no extra wrapper divs).
  onBack?: () => void
}

// Multi-step flow: fill out the form -> verify identity with a live selfie
// held next to the uploaded ID -> brief "matching" simulation -> final
// status is "waiting for admin approval" (not an immediate hard "submitted").
type Step = "form" | "verify" | "matching" | "pending"

export default function ApplyAICS({ initialType, onBack }: ApplyAICSProps) {
  const { t } = useLanguage()

  const assistanceTypes = [
    t("assistMedical"),
    t("assistBurial"),
    t("assistEducational"),
    t("assistTransportationLower"),
  ]

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [type, setType] = useState(initialType || assistanceTypes[0])
  const [narrative, setNarrative] = useState("")
  const [reference, setReference] = useState("")
  const [step, setStep] = useState<Step>("form")

  // Supporting document — valid ID (required for verification matching)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Verification selfie — resident holding their valid ID, captured live
  // from the camera instead of picked from a file dialog.
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const isTypeLocked = Boolean(initialType)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachment(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setAttachment(null)
    setPreviewUrl(null)
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  // Opens the device camera directly (no OS file picker) so the resident
  // can take the verification selfie in one tap.
  const handleOpenCamera = async () => {
    setCameraError("")
    setVerifyError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      // video element mounts on next render; attach once it's available
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setCameraError(
        "We couldn't access your camera. Please allow camera permission, or make sure your device has one."
      )
    }
  }

  const handleCaptureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1) // mirror, so it looks like a normal selfie
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.9))
    stopCamera()
    setCameraOpen(false)
  }

  const handleRetakeSelfie = () => {
    setSelfieDataUrl(null)
    handleOpenCamera()
  }

  const handleCancelCamera = () => {
    stopCamera()
    setCameraOpen(false)
  }

  const handleRemoveSelfie = () => {
    setSelfieDataUrl(null)
  }

  const canSubmit = name.trim() && address.trim() && contact.trim() && narrative.trim()

  // Step 1: form is complete -> move to identity verification instead of
  // submitting right away. Requires a valid ID to already be attached,
  // since the selfie is matched against it.
  const handleContinueToVerify = () => {
    if (!canSubmit) return
    if (!attachment) {
      setVerifyError("Please attach a photo of your valid ID first.")
      return
    }
    setVerifyError("")
    setStep("verify")
  }

  // Step 2: resident captures a live selfie holding the same ID -> simulate
  // the matching/verification process -> land on the pending-approval screen.
  const handleVerifyAndSubmit = () => {
    if (!selfieDataUrl) {
      setVerifyError("Please take a selfie holding your valid ID to continue.")
      return
    }
    setVerifyError("")
    setStep("matching")
    setReference(generateReference())

    // Simulated ID-to-selfie match. In production this calls a verification
    // service; here we just give the UI a believable moment before landing
    // on the "waiting for admin approval" state.
    setTimeout(() => {
      setStep("pending")
    }, 1800)
  }

  if (step === "matching") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Verifying your identity</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Matching your selfie with your uploaded ID. This will only take a moment...
          </p>
        </div>
      </div>
    )
  }

  if (step === "pending") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Waiting for admin approval</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thank you, {name}. Your identity has been verified and your {type.toLowerCase()} request is now
            waiting for approval by a social worker.
          </p>
          <div className="mt-2 bg-muted rounded-xl px-4 py-3 w-full">
            <p className="text-xs text-muted-foreground">{t("referenceNumber")}</p>
            <p className="text-sm font-semibold text-foreground">{reference}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("saveReferenceNote")}
          </p>
        </div>
      </div>
    )
  }

  if (step === "verify") {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <button
          onClick={() => {
            stopCamera()
            setCameraOpen(false)
            setStep("form")
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <PageHeader
          title="Verify your identity"
          desc="For your security, take a live selfie holding the same valid ID you uploaded. We'll match it before sending your application for admin approval."
        />

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ScanFace className="h-4 w-4 text-primary" />
            ID verification
          </div>

          {/* Reference thumbnail of the ID already on file */}
          {previewUrl && (
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-3">
              <img src={previewUrl} alt={attachment?.name ?? "ID"} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">ID on file</p>
                <p className="text-xs font-medium text-foreground truncate max-w-56">{attachment?.name}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Selfie holding your valid ID
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Make sure your face and the ID details are both clearly visible.
            </p>

            {/* Live camera preview */}
            {cameraOpen && (
              <div className="space-y-3">
                <div className="relative w-full max-w-xs mx-auto aspect-square rounded-xl overflow-hidden border border-border bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureSelfie}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCamera}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Captured selfie preview */}
            {!cameraOpen && selfieDataUrl && (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={selfieDataUrl} alt="Captured selfie" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground">Selfie captured</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetakeSelfie}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSelfie}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nothing captured yet — one tap opens the camera directly */}
            {!cameraOpen && !selfieDataUrl && (
              <button
                type="button"
                onClick={handleOpenCamera}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Tap to open camera</span>
              </button>
            )}

            {cameraError && (
              <p className="text-xs text-destructive mt-2">{cameraError}</p>
            )}
          </div>

          {/* Hidden canvas used to grab a still frame from the video stream */}
          <canvas ref={canvasRef} className="hidden" />

          {verifyError && (
            <p className="text-xs text-destructive">{verifyError}</p>
          )}

          <button
            onClick={handleVerifyAndSubmit}
            disabled={!selfieDataUrl}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Verify & submit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      )}

      <PageHeader
        title={t("applyAicsTitle")}
        desc={t("applyAicsDesc")}
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          {t("applicantInformation")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("fullName")}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} h-10`} placeholder="Juan D. Dela Cruz" />
          </Field>
          <Field label={t("contactNumber")}>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={`${inputCls} h-10`} placeholder="09XX XXX XXXX" />
          </Field>
          <Field label={t("address")} full>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} h-10`} placeholder="Barangay, City" />
          </Field>
          <Field label={t("typeOfAssistance")} full>
            {isTypeLocked ? (
              <div className={`${inputCls} h-10 flex items-center font-medium text-foreground bg-primary/5 border border-primary/20 cursor-not-allowed`}>
                {type}
              </div>
            ) : (
              <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} h-10`}>
                {assistanceTypes.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("situationReason")} full>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder={t("situationPlaceholder")}
            />
          </Field>

          <Field label={t("attachSupportingDocument")} full>
            <p className="text-xs text-muted-foreground mb-2 -mt-1">{t("attachHint")}</p>

            {previewUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={previewUrl} alt={attachment?.name ?? "attachment"} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-xs text-foreground truncate max-w-48">{attachment?.name}</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer transition-colors">
                      {t("changeImage")}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("removeImage")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg h-32 cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">{t("chooseImage")}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("bringDocsNote")}
        </p>

        {verifyError && step === "form" && (
          <p className="text-xs text-destructive">{verifyError}</p>
        )}

        <button
          onClick={handleContinueToVerify}
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Continue to ID verification
        </button>
      </div>
    </div>
  )
}

const inputCls =
  "w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/40"

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}