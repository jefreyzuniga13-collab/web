import { useRef, useState } from "react"

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mimeType, setMimeType] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunks = useRef<Blob[]>([])

  const pickMimeType = () => {
    if (typeof MediaRecorder === "undefined") return ""
    if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus"
    if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg"
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4"
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus"
    return ""
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const startRecording = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasMic = devices.some((d) => d.kind === "audioinput")
      if (!hasMic) {
        alert("No se detectó ningún micrófono en tu dispositivo.")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const picked = pickMimeType()
      const recorder = picked ? new MediaRecorder(stream, { mimeType: picked }) : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      chunks.current = []

      setRecordingTime(0)
      setAudioBlob(null)
      setIsPaused(false)
      setIsRecording(false)
      setMimeType("")

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const t = recorder.mimeType || chunks.current[0]?.type || "application/octet-stream"
        const blob = new Blob(chunks.current, { type: t })

        setMimeType(t)
        setAudioBlob(blob)
        setIsRecording(false)
        setIsPaused(false)
        stopTimer()

        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
      }

      recorder.onpause = () => {
        setIsPaused(true)
        stopTimer()
      }

      recorder.onresume = () => {
        setIsPaused(false)
        startTimer()
      }

      recorder.start()
      setMimeType(recorder.mimeType || picked || "")
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error("Error al iniciar grabación:", err)
      alert("No se pudo acceder al micrófono. Verifica permisos del navegador.")
    }
  }

  const pauseRecording = () => {
    try {
      const r = mediaRecorderRef.current
      if (r && r.state === "recording") r.pause()
    } catch (err) {
      console.error("Error al pausar la grabación:", err)
    }
  }

  const resumeRecording = () => {
    try {
      const r = mediaRecorderRef.current
      if (r && r.state === "paused") r.resume()
    } catch (err) {
      console.error("Error al reanudar la grabación:", err)
    }
  }

  const stopRecording = () => {
    try {
      const r = mediaRecorderRef.current
      if (r && r.state !== "inactive") r.stop()
    } catch (err) {
      console.error("Error al detener la grabación:", err)
    }
  }

  const clearRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setIsRecording(false)
    setIsPaused(false)
    setMimeType("")
    chunks.current = []
  }

  return {
    isRecording,
    isPaused,
    audioBlob,
    recordingTime,
    mimeType,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  }
}