"use client";

import { useEffect, useRef, useState } from "react";

import type { UiMessages } from "@/lib/i18n";

type MusicState = "loading" | "ready" | "playing" | "paused";

const AUDIO_SRC = "/media/perfect.mp3";

type Props = {
  messages: UiMessages["music"];
};

export default function BackgroundMusic({ messages }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [state, setState] = useState<MusicState>("ready");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

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
        <div className="invitation-gate" role="dialog" aria-modal="true">
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
