import { useState, useRef } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasMic = devices.some((d) => d.kind === 'audioinput')
      if (!hasMic) {
        alert('No se detectó ningún micrófono en tu dispositivo.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)

      chunks.current = []
      setRecordingTime(0)

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/ogg;' });
      setAudioBlob(blob);
      setIsRecording(false);
      clearInterval(timerRef.current!);
    };


      mediaRecorderRef.current.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error al iniciar grabación:', err)
      alert(
        'No se pudo acceder al micrófono. Verifica que esté conectado y que hayas dado permiso en el navegador.'
      )
    }
  }

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch (err) {
      console.error('Error al detener la grabación:', err)
    }
  }

  const clearRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setIsRecording(false)
    chunks.current = []
  }

  return {
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording,
  }
}
