import { useCallback, useEffect, useState } from "react";

export function useSpeech(text: string) {
  const [speaking, setSpeaking] = useState(false);
  const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => stop, [stop, text]);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (speaking) {
      stop();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.toLowerCase().startsWith("fr"));
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    if (voice) utterance.voice = voice;
    const reset = () => setSpeaking(false);
    utterance.addEventListener("end", reset);
    utterance.addEventListener("error", reset);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking, stop, supported, text]);

  return { supported, speaking, toggle, stop };
}
