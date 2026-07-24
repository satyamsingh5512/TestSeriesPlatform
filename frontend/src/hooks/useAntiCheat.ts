'use client';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Violation categories tracked during a live attempt.
 * MAJOR violations count towards the warning/termination budget.
 * MINOR violations are blocked + logged but only surface a transient toast.
 */
export type ViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'PAGE_HIDE'
  | 'COPY'
  | 'CUT'
  | 'PASTE'
  | 'CONTEXT_MENU'
  | 'FORBIDDEN_KEY';

const MAJOR: ViolationType[] = ['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_HIDE'];

export interface WarningInfo {
  type: ViolationType;
  count: number;
  max: number;
  message: string;
}

export interface BlockedInfo {
  type: ViolationType;
  message: string;
}

interface UseAntiCheatOptions {
  attemptId: string | null;
  enabled: boolean;
  /** Number of MAJOR violations allowed before the attempt is terminated. Default 2. */
  maxWarnings?: number;
  /** Fired for a MAJOR violation that is still within the warning budget. */
  onWarning?: (info: WarningInfo) => void;
  /** Fired once when the warning budget is exceeded. */
  onTerminate?: (reason: string, count: number) => void;
  /** Fired for a MINOR (blocked) action such as copy/paste/right-click/forbidden key. */
  onBlocked?: (info: BlockedInfo) => void;
  /** Fired whenever fullscreen is exited so the page can show a re-entry gate. */
  onFullscreenExit?: (opts: { terminating: boolean }) => void;
}

function warningMessage(type: ViolationType): string {
  switch (type) {
    case 'TAB_SWITCH':
      return 'You switched away from the exam tab.';
    case 'WINDOW_BLUR':
      return 'The exam window lost focus (another window/app was opened).';
    case 'FULLSCREEN_EXIT':
      return 'You exited fullscreen mode.';
    case 'PAGE_HIDE':
      return 'The exam page was hidden or navigated away from.';
    default:
      return 'A proctoring rule was violated.';
  }
}

function blockedMessage(type: ViolationType): string {
  switch (type) {
    case 'COPY':
      return 'Copying is disabled during the exam.';
    case 'CUT':
      return 'Cutting is disabled during the exam.';
    case 'PASTE':
      return 'Pasting is disabled during the exam.';
    case 'CONTEXT_MENU':
      return 'Right-click is disabled during the exam.';
    case 'FORBIDDEN_KEY':
      return 'That keyboard shortcut is disabled during the exam.';
    default:
      return 'This action is disabled during the exam.';
  }
}

/**
 * Comprehensive client-side anti-cheat for a live exam attempt.
 *
 * Detects tab switches, window blur, fullscreen exit, page-hide, copy/paste/cut,
 * right-click, and DevTools/print/view-source/save keyboard shortcuts. MAJOR
 * violations accumulate against a warning budget; exceeding it triggers
 * termination. All violations are batched and logged to the backend for
 * proctor review.
 */
export function useAntiCheat(opts: UseAntiCheatOptions) {
  const { attemptId, enabled } = opts;
  const maxWarnings = opts.maxWarnings ?? 2;

  // Keep the latest callbacks/config in a ref so we never re-subscribe listeners
  // (and never fire stale closures) on every render.
  const cbRef = useRef(opts);
  cbRef.current = opts;

  const warningsRef = useRef(0);
  const terminatedRef = useRef(false);
  const lastMajorAtRef = useRef(0);
  const queueRef = useRef<Array<{ type: ViolationType; details: any; occurred_at: string }>>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!attemptId || queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, queueRef.current.length);
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      // keepalive lets the request survive tab-close / navigation.
      fetch(`${base}/api/attempts/${attemptId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ violations: batch }),
        keepalive: true,
      }).catch(() => {
        // Re-queue on network failure so nothing is silently dropped.
        queueRef.current.unshift(...batch);
      });
    } catch {
      queueRef.current.unshift(...batch);
    }
  }, [attemptId]);

  const log = useCallback(
    (type: ViolationType, details: any = {}, immediate = false) => {
      queueRef.current.push({ type, details, occurred_at: new Date().toISOString() });
      if (immediate) {
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flush();
        return;
      }
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          flush();
        }, 1000);
      }
    },
    [flush]
  );

  // Imperatively stop all detection (used by the page when it submits, so the
  // programmatic exitFullscreen() during submit is not counted as a violation).
  const disarm = useCallback(() => {
    terminatedRef.current = true;
    flush();
  }, [flush]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Reset per-attempt state when detection (re)activates.
    terminatedRef.current = false;

    const handleMajor = (type: ViolationType, details: any = {}) => {
      if (terminatedRef.current) return;

      // Coalesce events that fire together for a single action (e.g. a tab
      // switch emits both `visibilitychange` and `blur`), so it counts once.
      const now = Date.now();
      if (now - lastMajorAtRef.current < 700) {
        log(type, { ...details, coalesced: true });
        return;
      }
      lastMajorAtRef.current = now;

      warningsRef.current += 1;
      const count = warningsRef.current;
      const exceeded = count > maxWarnings;
      log(type, { ...details, warning_count: count, terminated: exceeded }, true);

      if (exceeded) {
        terminatedRef.current = true;
        cbRef.current.onTerminate?.(type.toLowerCase(), count);
      } else {
        cbRef.current.onWarning?.({ type, count, max: maxWarnings, message: warningMessage(type) });
      }
    };

    const handleBlocked = (type: ViolationType, e?: Event, details: any = {}) => {
      if (terminatedRef.current) return;
      e?.preventDefault?.();
      log(type, details);
      cbRef.current.onBlocked?.({ type, message: blockedMessage(type) });
    };

    const onVisibility = () => {
      if (document.hidden) handleMajor('TAB_SWITCH');
    };
    const onBlur = () => handleMajor('WINDOW_BLUR');
    const onPageHide = () => handleMajor('PAGE_HIDE');
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleMajor('FULLSCREEN_EXIT');
        cbRef.current.onFullscreenExit?.({ terminating: terminatedRef.current });
      }
    };

    const onCopy = (e: Event) => handleBlocked('COPY', e);
    const onCut = (e: Event) => handleBlocked('CUT', e);
    const onPaste = (e: Event) => handleBlocked('PASTE', e);
    const onContextMenu = (e: Event) => handleBlocked('CONTEXT_MENU', e);

    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const lower = key.length === 1 ? key.toLowerCase() : key;
      const forbidden =
        key === 'F12' ||
        key === 'PrintScreen' ||
        (e.altKey && key === 'Tab') ||
        (ctrl && key === 'Tab') ||
        // DevTools
        (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(lower)) ||
        // view-source / save / print / copy / paste / cut / select-all
        (ctrl && ['u', 's', 'p', 'c', 'v', 'x', 'a'].includes(lower));
      if (forbidden) {
        handleBlocked('FORBIDDEN_KEY', e, {
          key,
          ctrl,
          shift: e.shiftKey,
          alt: e.altKey,
        });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKey, { capture: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKey, { capture: true } as any);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      flush();
    };
  }, [enabled, maxWarnings, log, flush]);

  return { disarm };
}
