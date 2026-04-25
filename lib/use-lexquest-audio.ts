"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioSettings } from "@/lib/game-types";

type AudioController = {
  unlockAudio: () => void;
  playDocumentOpen: () => void;
  playDocumentClose: () => void;
  playDecisionCommit: () => void;
  playTensionPulse: () => void;
  stopTensionPulse: () => void;
  audioSettings: AudioSettings;
  setMusicVolume: (value: number) => void;
  setEffectsVolume: (value: number) => void;
};

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 0.03,
  effectsVolume: 0.6
};

const STORAGE_KEY = "lexquest-audio-settings";

let globalBgm: HTMLAudioElement | null = null;
let globalTension: HTMLAudioElement | null = null;

function readStoredAudioSettings(): AudioSettings {
  if (typeof window === "undefined") {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_AUDIO_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AudioSettings>;

    return {
      musicVolume:
        typeof parsed.musicVolume === "number" ? Math.max(0, Math.min(1, parsed.musicVolume)) : DEFAULT_AUDIO_SETTINGS.musicVolume,
      effectsVolume:
        typeof parsed.effectsVolume === "number"
          ? Math.max(0, Math.min(1, parsed.effectsVolume))
          : DEFAULT_AUDIO_SETTINGS.effectsVolume
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function useLexQuestAudio(): AudioController {
  const docOpenRef = useRef<HTMLAudioElement | null>(null);
  const docCloseRef = useRef<HTMLAudioElement | null>(null);
  const decisionRef = useRef<HTMLAudioElement | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);

  useEffect(() => {
    const initialSettings = readStoredAudioSettings();
    setAudioSettings(initialSettings);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!globalBgm) {
      globalBgm = new Audio("/audio/background-tension.mp3");
      globalBgm.loop = true;
    }

    if (!globalTension) {
      globalTension = new Audio("/audio/tension-pulse.mp3");
      globalTension.loop = true;
    }

    docOpenRef.current = new Audio("/audio/document-open.mp3");
    docCloseRef.current = new Audio("/audio/document-close.mp3");
    decisionRef.current = new Audio("/audio/decision-commit.mp3");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audioSettings));
    }

    if (globalBgm) {
      globalBgm.volume = audioSettings.musicVolume;
    }

    if (globalTension) {
      globalTension.volume = Math.min(1, audioSettings.musicVolume * 0.75);
    }

    if (docOpenRef.current) {
      docOpenRef.current.volume = audioSettings.effectsVolume;
    }

    if (docCloseRef.current) {
      docCloseRef.current.volume = audioSettings.effectsVolume;
    }

    if (decisionRef.current) {
      decisionRef.current.volume = audioSettings.effectsVolume;
    }
  }, [audioSettings]);

  const unlockAudio = useCallback(() => {
    if (globalBgm && globalBgm.paused && audioSettings.musicVolume > 0) {
      globalBgm.play().catch(console.error);
    }

    if (globalTension && globalTension.paused && audioSettings.musicVolume > 0) {
      globalTension.play().catch(console.error);
    }
  }, [audioSettings.musicVolume]);

  const playDocumentOpen = useCallback(() => {
    if (docOpenRef.current && audioSettings.effectsVolume > 0) {
      docOpenRef.current.currentTime = 0;
      docOpenRef.current.play().catch(console.error);
    }
  }, [audioSettings.effectsVolume]);

  const playDocumentClose = useCallback(() => {
    if (docCloseRef.current && audioSettings.effectsVolume > 0) {
      docCloseRef.current.currentTime = 0;
      docCloseRef.current.play().catch(console.error);
    }
  }, [audioSettings.effectsVolume]);

  const playDecisionCommit = useCallback(() => {
    if (decisionRef.current && audioSettings.effectsVolume > 0) {
      decisionRef.current.currentTime = 0;
      decisionRef.current.play().catch(console.error);
    }
  }, [audioSettings.effectsVolume]);

  const playTensionPulse = useCallback(() => {
    if (globalTension && globalTension.paused && audioSettings.musicVolume > 0) {
      globalTension.play().catch(console.error);
    }
  }, [audioSettings.musicVolume]);

  const stopTensionPulse = useCallback(() => {
    if (globalTension && !globalTension.paused) {
      globalTension.pause();
    }
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    setAudioSettings((current) => ({
      ...current,
      musicVolume: Math.max(0, Math.min(1, value))
    }));
  }, []);

  const setEffectsVolume = useCallback((value: number) => {
    setAudioSettings((current) => ({
      ...current,
      effectsVolume: Math.max(0, Math.min(1, value))
    }));
  }, []);

  return {
    unlockAudio,
    playDocumentOpen,
    playDocumentClose,
    playDecisionCommit,
    playTensionPulse,
    stopTensionPulse,
    audioSettings,
    setMusicVolume,
    setEffectsVolume
  };
}
