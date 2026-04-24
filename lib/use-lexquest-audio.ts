"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioController = {
  unlockAudio: () => void;
  playDocumentOpen: () => void;
  playDocumentClose: () => void;
  playDecisionCommit: () => void;
  playTensionPulse: () => void;
};

function createNoiseBuffer(context: AudioContext, durationSeconds: number) {
  const buffer = context.createBuffer(1, context.sampleRate * durationSeconds, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.35;
  }

  return buffer;
}

export function useLexQuestAudio(): AudioController {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
    };
  }, []);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        return null;
      }

      audioContextRef.current = new AudioContextCtor();
    }

    return audioContextRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }
  }, [getContext]);

  const playDocumentOpen = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context, 0.2);

    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    const tone = context.createOscillator();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(620, now);
    tone.frequency.exponentialRampToValueAtTime(380, now + 0.18);

    const toneGain = context.createGain();
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    source.connect(noiseGain).connect(context.destination);
    tone.connect(toneGain).connect(context.destination);
    source.start(now);
    source.stop(now + 0.22);
    tone.start(now);
    tone.stop(now + 0.22);
  }, [getContext]);

  const playDocumentClose = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const tone = context.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(280, now);
    tone.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    tone.connect(gain).connect(context.destination);
    tone.start(now);
    tone.stop(now + 0.14);
  }, [getContext]);

  const playDecisionCommit = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const base = context.createOscillator();
    base.type = "square";
    base.frequency.setValueAtTime(220, now);
    base.frequency.exponentialRampToValueAtTime(330, now + 0.16);

    const overlay = context.createOscillator();
    overlay.type = "triangle";
    overlay.frequency.setValueAtTime(440, now);
    overlay.frequency.exponentialRampToValueAtTime(550, now + 0.16);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    base.connect(gain);
    overlay.connect(gain);
    gain.connect(context.destination);
    base.start(now);
    overlay.start(now);
    base.stop(now + 0.2);
    overlay.stop(now + 0.2);
  }, [getContext]);

  const playTensionPulse = useCallback(() => {
    const context = getContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const tone = context.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(110, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.015, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    tone.connect(gain).connect(context.destination);
    tone.start(now);
    tone.stop(now + 0.55);
  }, [getContext]);

  return {
    unlockAudio,
    playDocumentOpen,
    playDocumentClose,
    playDecisionCommit,
    playTensionPulse
  };
}
