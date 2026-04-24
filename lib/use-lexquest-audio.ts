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

export function useLexQuestAudio(): AudioController {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const docOpenRef = useRef<HTMLAudioElement | null>(null);
  const docCloseRef = useRef<HTMLAudioElement | null>(null);
  const decisionRef = useRef<HTMLAudioElement | null>(null);
  const tensionRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Música de fundo contínua (loop)
      bgmRef.current = new Audio("/audio/background-tension.mp3");
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.3; // Deixe um volume mais baixo para não ofuscar os efeitos

      // Efeitos sonoros
      docOpenRef.current = new Audio("/audio/document-open.mp3");
      docCloseRef.current = new Audio("/audio/document-close.mp3");
      decisionRef.current = new Audio("/audio/decision-commit.mp3");
      tensionRef.current = new Audio("/audio/tension-pulse.mp3");
    }

    return () => {
      // Cleanup para evitar que a música continue tocando se o componente desmontar
      bgmRef.current?.pause();
    };
  }, []);

  const unlockAudio = useCallback(() => {
    // Navegadores exigem interação do usuário para tocar áudio.
    // O unlockAudio agora toca a música de fundo e garante que o contexto de mídia seja iniciado.
    if (bgmRef.current && bgmRef.current.paused) {
      bgmRef.current.play().catch(console.error);
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
    if (tensionRef.current) {
      tensionRef.current.currentTime = 0;
      tensionRef.current.play().catch(console.error);
    }
  }, []);
  
  const toggleBackgroundMusic = useCallback(() => {
    if (!bgmRef.current) return;
    
    if (bgmRef.current.paused) {
      bgmRef.current.play().catch(console.error);
    } else {
      bgmRef.current.pause();
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
