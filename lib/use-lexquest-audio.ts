"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioController = {
  unlockAudio: () => void;
  playDocumentOpen: () => void;
  playDocumentClose: () => void;
  playDecisionCommit: () => void;
  playTensionPulse: () => void;
  toggleBackgroundMusic: () => void;
};

// Instância global para a música não reiniciar ao trocar de fase
let globalBgm: HTMLAudioElement | null = null;
let globalTension: HTMLAudioElement | null = null;

export function useLexQuestAudio(): AudioController {
  const docOpenRef = useRef<HTMLAudioElement | null>(null);
  const docCloseRef = useRef<HTMLAudioElement | null>(null);
  const decisionRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Inicializa a música globalmente apenas uma vez
      if (!globalBgm) {
        globalBgm = new Audio("/audio/background-tension.mp3");
        globalBgm.loop = true;
        globalBgm.volume = 0.225; // Volume reduzido em 25% (de 0.3 para 0.225)
      }

      // Efeitos sonoros
      docOpenRef.current = new Audio("/audio/document-open.mp3");
      docCloseRef.current = new Audio("/audio/document-close.mp3");
      decisionRef.current = new Audio("/audio/decision-commit.mp3");
      if (!globalTension) {
        globalTension = new Audio("/audio/tension-pulse.mp3");
        globalTension.loop = true;
        globalTension.volume = 0.23;
      }
    }
  }, []);

  const unlockAudio = useCallback(() => {
    // Navegadores exigem interação do usuário para tocar áudio.
    // O unlockAudio agora toca a música de fundo e garante que o contexto de mídia seja iniciado.
    if (globalBgm && globalBgm.paused) {
      globalBgm.play().catch(console.error);
    }
  }, []);

  const playDocumentOpen = useCallback(() => {
    if (docOpenRef.current) {
      docOpenRef.current.currentTime = 0; // Reinicia o som se for tocado rapidamente seguidas vezes
      docOpenRef.current.play().catch(console.error);
    }
  }, []);

  const playDocumentClose = useCallback(() => {
    if (docCloseRef.current) {
      docCloseRef.current.currentTime = 0;
      docCloseRef.current.play().catch(console.error);
    }
  }, []);

  const playDecisionCommit = useCallback(() => {
    if (decisionRef.current) {
      decisionRef.current.currentTime = 0;
      decisionRef.current.play().catch(console.error);
    }
  }, []);

  const playTensionPulse = useCallback(() => {
    if (globalTension && globalTension.paused) {
      globalTension.play().catch(console.error);
    }
  }, []);
  
  const toggleBackgroundMusic = useCallback(() => {
    if (!globalBgm) return;
    
    if (globalBgm.paused) {
      globalBgm.play().catch(console.error);
    } else {
      globalBgm.pause();
    }
  }, []);

  return {
    unlockAudio,
    playDocumentOpen,
    playDocumentClose,
    playDecisionCommit,
    playTensionPulse,
    toggleBackgroundMusic
  };
}
