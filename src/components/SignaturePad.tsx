import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import SignaturePadLib from 'signature_pad';

export type SignaturePadHandle = {
  clear: () => void;
  toDataURL: () => string | null;
};

const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(function SignaturePad({ className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    padRef.current = new SignaturePadLib(canvasRef.current, { backgroundColor: 'rgba(0,0,0,0)' });

    const resize = () => {
      const canvas = canvasRef.current!;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      padRef.current?.clear();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => padRef.current?.clear() ?? undefined,
    toDataURL: () => (padRef.current && !padRef.current.isEmpty() ? padRef.current.toDataURL() : null),
  }));

  return (
    <div className={className} style={{ border: '1px solid #ddd', borderRadius: 6 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 200 }} />
    </div>
  );
});

export default SignaturePad;
