import React, { useEffect, useRef } from 'react';
import jsQR from 'jsqr';

interface QrScannerProps {
  onDecode: (text: string) => void;
  onError: (message: string) => void;
}

// Lee QR con la cámara trasera. Al primer código detiene la cámara y llama onDecode una sola vez.
const QrScanner: React.FC<QrScannerProps> = ({ onDecode, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodeRef = useRef(onDecode);
  const onErrorRef = useRef(onError);
  onDecodeRef.current = onDecode;
  onErrorRef.current = onError;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const canvas = document.createElement('canvas');

    const stop = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };

    const tick = () => {
      const video = videoRef.current;
      if (stopped || !video) return;
      if (video.videoWidth) {
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) {
            stop();
            onDecodeRef.current(code.data);
            return;
          }
        }
      }
      timer = setTimeout(tick, 150);
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara');
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
        tick();
      } catch {
        const cancelado = stopped;
        stop();
        if (!cancelado) onErrorRef.current('Cámara no disponible; escribe el código');
      }
    };

    start();
    return stop;
  }, []);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      aria-label="Vista de la cámara para leer el código QR"
      className="w-full max-w-sm rounded-2xl border border-slate-700 bg-black"
    />
  );
};

export default QrScanner;
