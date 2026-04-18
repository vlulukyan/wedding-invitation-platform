"use client";

import { useEffect } from "react";
import { templateScriptPaths } from "@/constants/templateAssets";

type CountdownLabels = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type Props = {
  countdownLabels: CountdownLabels;
};

export default function TemplateScripts({ countdownLabels }: Props) {
  useEffect(() => {
    let isMounted = true;
    const injected: HTMLScriptElement[] = [];
    let countdownTimer: number | undefined;

    const renderCountdown = () => {
      const clock = document.getElementById("cms-countdown");
      const targetValue = clock?.dataset.countdownTarget;
      if (!clock || !targetValue) {
        return;
      }

      const normalizedTargetValue = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(targetValue)
        ? targetValue.replace(/\s+/, "T")
        : targetValue;
      const target = new Date(normalizedTargetValue);
      if (Number.isNaN(target.getTime())) {
        return;
      }

      const update = () => {
        const distance = Math.max(0, target.getTime() - Date.now());
        const totalSeconds = Math.floor(distance / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const units: Array<[string, number]> = [
          [countdownLabels.days, days],
          [countdownLabels.hours, hours],
          [countdownLabels.minutes, minutes],
          [countdownLabels.seconds, seconds],
        ];
        clock.innerHTML = units
          .map(([label, value]) => `<div class="box"><div><div class="time">${value}</div> <span>${label}</span> </div></div>`)
          .join("");
      };

      update();
      countdownTimer = window.setInterval(update, 500);
    };

    const loadSequentially = async () => {
      for (const src of templateScriptPaths) {
        if (!isMounted) {
          return;
        }

        const alreadyLoaded = document.querySelector(
          `script[data-template-src="${src}"]`
        ) as HTMLScriptElement | null;
        if (alreadyLoaded) {
          continue;
        }

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.dataset.templateSrc = src;
          script.onload = () => resolve();
          script.onerror = () => {
            console.error(`Failed to load template script: ${src}`);
            reject(new Error(`Failed to load ${src}`));
          };
          document.body.appendChild(script);
          injected.push(script);
        }).catch(() => {
          // Keep rendering the rest of the UI even if a vendor script fails.
        });
      }
      renderCountdown();
    };

    loadSequentially();

    return () => {
      isMounted = false;
      injected.forEach((script) => {
        script.remove();
      });
      if (countdownTimer) {
        window.clearInterval(countdownTimer);
      }
    };
  }, [countdownLabels]);

  return null;
}
