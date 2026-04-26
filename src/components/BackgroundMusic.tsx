"use client";

import { useEffect, useRef, useState } from "react";

import type { UiMessages } from "@/lib/i18n";

type MusicState = "loading" | "ready" | "playing" | "paused";
const SKIP_INVITATION_GATE_KEY = "aya_skip_invitation_gate_once";

type Props = {
  messages: UiMessages["music"];
  gateBackgroundUrl?: string | null;
  audioSrc?: string | null;
};

export default function BackgroundMusic({ messages, gateBackgroundUrl, audioSrc }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [state, setState] = useState<MusicState>("ready");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem(SKIP_INVITATION_GATE_KEY) === "true") {
      window.sessionStorage.removeItem(SKIP_INVITATION_GATE_KEY);
      setEntered(true);
    }
  }, []);

  useEffect(() => {
    const source = audioSrc || "/media/perfect.mp3";
    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return false;
    }

    try {
      await audio.play();
      setState("playing");
      setError(null);
      return true;
    } catch (err) {
      console.error("Unable to start music", err);
      setError(messages.enable);
      setState("ready");
      return false;
    }
  };

  const enterInvitation = async () => {
    setState("loading");
    await play();
    setEntered(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      await play();
    } else {
      audio.pause();
      setState("paused");
    }
  };

  const label = (() => {
    if (error) {
      return error;
    }

    switch (state) {
      case "playing":
        return messages.playing;
      case "paused":
        return messages.paused;
      case "ready":
        return messages.ready;
      default:
        return messages.loading;
    }
  })();

  return (
    <>
      {!entered && (
        <div
          className="invitation-gate"
          role="dialog"
          aria-modal="true"
          style={
            gateBackgroundUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.74)), url("${gateBackgroundUrl}")`,
                }
              : undefined
          }
        >
          <button type="button" className="invitation-gate__button" onClick={enterInvitation}>
            {messages.enter}
          </button>
        </div>
      )}
      <div className="music-toggle" role="status" aria-live="polite">
        <button
          type="button"
          onClick={toggle}
          className={`music-toggle__button${state === "playing" ? " music-toggle__button--active" : ""}`}
        >
          {state === "playing" ? messages.pause : messages.play}
        </button>
        <span className="music-toggle__status">{label}</span>
      </div>
    </>
  );
}
