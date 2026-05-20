'use client';
import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const DETECTION_INTERVAL_MS = 3000;
const NO_FACE_TOLERANCE_S = 5;

interface ProctorOptions {
  attemptId: string | null;
  enabled: boolean;
  onViolation?: (type: string) => void;
}

export function useProctor({ attemptId, enabled, onViolation }: ProctorOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const noFaceStartRef = useRef<number | null>(null);
  const pendingViolationsRef = useRef<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addViolation = useCallback((type: string, details: object = {}) => {
    pendingViolationsRef.current.push({ type, details, occurred_at: new Date().toISOString() });
    onViolation?.(type);
  }, [onViolation]);

  const flushViolations = useCallback(async () => {
    if (!attemptId || pendingViolationsRef.current.length === 0) return;
    const toFlush = [...pendingViolationsRef.current];
    pendingViolationsRef.current = [];
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/attempts/${attemptId}/violations`,
        { violations: toFlush },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Silently re-queue on failure
      pendingViolationsRef.current = [...toFlush, ...pendingViolationsRef.current];
    }
  }, [attemptId]);

  const runDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
    try {
      const faces = await detectorRef.current.estimateFaces(videoRef.current);

      if (faces.length === 0) {
        if (noFaceStartRef.current === null) {
          noFaceStartRef.current = Date.now();
        } else if ((Date.now() - noFaceStartRef.current) > NO_FACE_TOLERANCE_S * 1000) {
          addViolation('NO_FACE', { duration_seconds: Math.round((Date.now() - noFaceStartRef.current) / 1000) });
          noFaceStartRef.current = Date.now(); // Reset to avoid spamming
        }
      } else {
        noFaceStartRef.current = null;
        if (faces.length > 1) {
          addViolation('MULTIPLE_FACES', { face_count: faces.length });
        }
      }
    } catch {
      // Detector might not be ready yet, ignore
    }
  }, [addViolation]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let destroyed = false;

    async function initProctor() {
      try {
        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (destroyed) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Create hidden video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;

        // Lazily load TensorFlow only in browser to avoid SSR issues
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        const faceDetection = await import('@tensorflow-models/face-detection');
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detector = await faceDetection.createDetector(model, { runtime: 'tfjs' });
        if (destroyed) return;
        detectorRef.current = detector;

        intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
        flushIntervalRef.current = setInterval(flushViolations, 15000);
      } catch (err: any) {
        // Camera denied — not a fatal error for exam flow
        console.warn('[Proctor] Camera access denied or error:', err?.message);
      }
    }

    initProctor();

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (videoRef.current) {
        videoRef.current.remove();
        videoRef.current = null;
      }
      detectorRef.current = null;
      // Final flush on cleanup
      flushViolations();
    };
  }, [enabled, runDetection, flushViolations]);

  return { flushViolations };
}
