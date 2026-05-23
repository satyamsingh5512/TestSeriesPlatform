'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface ProctorOptions {
  attemptId: string | null;
  enabled: boolean;
}

export function useProctor({ attemptId, enabled }: ProctorOptions) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // To prevent multiple initializations
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || initialized.current) return;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: 15 }, 
          audio: false 
        });
        
        streamRef.current = mediaStream;
        setStream(mediaStream);
        initialized.current = true;
        console.log('[Proctor] Camera feed active');
      } catch (err: any) {
        console.warn('[Proctor] Camera access denied:', err?.message);
      }
    }

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStream(null);
        initialized.current = false;
      }
    };
  }, [enabled]);

  /**
   * Capture a snapshot from the current stream
   * Returns a base64 string
   */
  const captureSnapshot = useCallback(() => {
    if (!streamRef.current) return null;

    const video = document.createElement('video');
    video.srcObject = streamRef.current;
    video.play();

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.6);
      return data;
    }
    return null;
  }, []);

  return { stream, captureSnapshot };
}
