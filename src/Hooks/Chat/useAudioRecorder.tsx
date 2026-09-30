/* eslint-disable no-empty */
import { useCallback, useRef, useState } from "react";
import { createMp3Encoder } from "wasm-media-encoders";

type Mp3RecorderState = {
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
};

// Tip mínimo (evita genéricos WasmMediaEncoder<MimeType>)
type Mp3EncoderLike = {
  configure: (cfg: {
    sampleRate: number;
    channels: number;
    bitrate: number;
    outputSampleRate?: number;
  }) => void;
  encode: (channels: Float32Array[]) => Uint8Array;
  finalize: () => Uint8Array;
};

export function useAudioRecorder(): Mp3RecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const pcmFloatChunksRef = useRef<Float32Array[]>([]);
  const inputSampleRateRef = useRef<number>(48000);

  const encoderRef = useRef<Mp3EncoderLike | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupGraph = () => {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      gainRef.current?.disconnect();
    } catch {}
    processorRef.current = null;
    sourceRef.current = null;
    gainRef.current = null;
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const cleanupContext = async () => {
    try {
      await audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;
  };

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    pcmFloatChunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    inputSampleRateRef.current = audioCtx.sampleRate;

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gainRef.current = gain;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      pcmFloatChunksRef.current.push(new Float32Array(input)); // copia segura
    };

    source.connect(processor);
    processor.connect(gain);
    gain.connect(audioCtx.destination);

    setIsRecording(true);
    timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
  }, [isRecording]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    setIsRecording(false);
    stopTimer();

    cleanupGraph();
    cleanupStream();
    void cleanupContext();

    // Crear encoder una vez (reutilizable)
    if (!encoderRef.current) {
      // createMp3Encoder() devuelve un encoder con encode/finalize
      encoderRef.current = (await createMp3Encoder()) as unknown as Mp3EncoderLike;
    }

    const sampleRate = inputSampleRateRef.current || 48000;
    const encoder = encoderRef.current;

    encoder.configure({
      sampleRate,
      channels: 1,
      bitrate: 96,
      outputSampleRate: sampleRate,
    });

    //usa BlobPart[] y empuja ArrayBuffer (no Uint8Array) para evitar SharedArrayBuffer typing
    const parts: BlobPart[] = [];

   const pushBytes = (u8: Uint8Array) => {
          if (!u8 || u8.length === 0) return;

          const copy = new Uint8Array(u8.byteLength);
          copy.set(u8);

          parts.push(copy.buffer);
        };

    for (const chunk of pcmFloatChunksRef.current) {
      const mp3Data = encoder.encode([chunk]); // mono => 1 canal
      pushBytes(mp3Data);
    }

    const end = encoder.finalize();
    pushBytes(end);

    pcmFloatChunksRef.current = [];
    setAudioBlob(new Blob(parts, { type: "audio/mpeg" }));
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setIsRecording(false);
    stopTimer();

    cleanupGraph();
    cleanupStream();
    void cleanupContext();

    pcmFloatChunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);
  }, []);

  return { isRecording, audioBlob, recordingTime, startRecording, stopRecording, clearRecording };
}