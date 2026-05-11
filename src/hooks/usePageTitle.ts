import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | VFL AI Predictor`;
  }, [title]);
}