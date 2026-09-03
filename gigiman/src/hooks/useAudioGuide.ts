/**
 * useAudioGuide — Custom hook for audio-guided onboarding.
 *
 * Features:
 * - Auto-plays role/step-specific audio on step change (300ms delay)
 * - Prevents replay when navigating back (tracks played steps)
 * - Mute / unmute toggle
 * - Replay current step on demand
 * - Stops & unloads previous audio before playing new one (no overlap)
 * - Full cleanup on unmount (no memory leaks)
 * - All audio ops wrapped in try/catch (fail silently)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { getAudioForStep } from '@/utils/config/audioGuide.config';

export const useAudioGuide = (currentStep: number, role: string) => {
  // ─── State ───
  const [isMuted, setIsMuted] = useState(false);

  // ─── Refs (survive re-renders, no re-render triggers) ───
  const soundRef = useRef<Audio.Sound | null>(null);
  const playedStepsRef = useRef<Set<string>>(new Set());
  const isMutedRef = useRef(isMuted);
  const mountedRef = useRef(true);

  // Keep muted ref in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // ─── Stop & unload any currently playing sound ───
  const stopAndUnload = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.warn('🔇 Audio stop/unload error:', err);
      soundRef.current = null;
    }
  }, []);

  // ─── Play a specific audio asset ───
  const playAudio = useCallback(
    async (asset: number) => {
      try {
        // Always stop previous sound first
        await stopAndUnload();

        // Bail if component unmounted during async gap
        if (!mountedRef.current) return;

        const { sound } = await Audio.Sound.createAsync(asset);

        // Bail again after another async gap
        if (!mountedRef.current) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        await sound.playAsync();
      } catch (err) {
        console.warn('🔊 Audio play error:', err);
      }
    },
    [stopAndUnload],
  );

  // ─── Auto-play on step/role change ───
  useEffect(() => {
    const stepKey = `${role}_${currentStep}`;

    // Skip if already played this step or muted
    if (playedStepsRef.current.has(stepKey) || isMutedRef.current) {
      return;
    }

    const asset = getAudioForStep(role, currentStep);
    if (!asset) return;

    // 300ms delay for smoother UX
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      playedStepsRef.current.add(stepKey);
      playAudio(asset);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, role, playAudio]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAndUnload();
    };
  }, [stopAndUnload]);

  // ─── Public API ───

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        // Muting — stop current audio immediately
        stopAndUnload();
      }
      return next;
    });
  }, [stopAndUnload]);

  const replayCurrentStep = useCallback(() => {
    if (isMutedRef.current) return;

    const asset = getAudioForStep(role, currentStep);
    if (!asset) return;

    playAudio(asset);
  }, [role, currentStep, playAudio]);

  return {
    isMuted,
    toggleMute,
    replayCurrentStep,
  };
};
