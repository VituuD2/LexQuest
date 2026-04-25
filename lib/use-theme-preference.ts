"use client";

import { useEffect, useState } from "react";
import type { ThemePreference } from "@/lib/game-types";

const STORAGE_KEY = "lexquest-theme-preference";

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  return rawValue === "light" || rawValue === "dark" || rawValue === "system" ? rawValue : "system";
}

function applyThemePreference(themePreference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  if (themePreference === "system") {
    root.removeAttribute("data-theme");
    return;
  }

  root.setAttribute("data-theme", themePreference);
}

export function useThemePreference() {
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const storedPreference = readStoredThemePreference();
    setThemePreference(storedPreference);
    applyThemePreference(storedPreference);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, themePreference);
    }

    applyThemePreference(themePreference);
  }, [themePreference]);

  return {
    themePreference,
    setThemePreference
  };
}
