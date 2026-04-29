"use client";

import { useEffect } from "react";

import type { Locale } from "@/lib/locales";
import type { UiMessages } from "@/lib/i18n";

type SubmitState = "idle" | "loading" | "success" | "error";

type Props = {
  locale: Locale;
  messages: UiMessages["rsvp"];
};

export default function RsvpFormHydrator({ locale, messages }: Props) {
  useEffect(() => {
    const form = document.getElementById("contact-form-main") as HTMLFormElement | null;
    if (!form) {
      return;
    }

    let state: SubmitState = "idle";
    const statusTarget = form.querySelector<HTMLDivElement>("#success");
    const errorTarget = form.querySelector<HTMLDivElement>("#error");
    const loader = form.querySelector<HTMLDivElement>("#c-loader");
    const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");

    const ensurePhoneInput = () => {
      let phoneInput = form.querySelector<HTMLInputElement>("input[name='phone']");
      if (phoneInput) {
        return phoneInput;
      }

      const nameInput = form.querySelector<HTMLInputElement>("input[name='name']");
      phoneInput = document.createElement("input");
      phoneInput.className = nameInput?.className ?? "form-control";
      phoneInput.id = "phone";
      phoneInput.name = "phone";
      phoneInput.placeholder = messages.phone;
      phoneInput.type = "tel";

      const wrapper = document.createElement("div");
      wrapper.appendChild(phoneInput);
      nameInput?.parentElement?.after(wrapper);
      return phoneInput;
    };

    ensurePhoneInput();

    const setPlaceholder = (selector: string, value: string) => {
      const input = form.querySelector<HTMLInputElement>(selector);
      if (input) {
        input.placeholder = value;
      }
    };

    const setLabel = (selector: string, value: string) => {
      const label = form.querySelector<HTMLLabelElement>(selector);
      if (label) {
        label.textContent = value;
      }
    };

    const setText = (selector: string, value: string) => {
      const element = form.querySelector<HTMLElement>(selector);
      if (element) {
        element.textContent = value;
      }
    };

    const ensurePlaceholderOption = (select: HTMLSelectElement, value: string) => {
      let option = select.querySelector<HTMLOptionElement>("option[disabled]") ?? select.options[0];
      if (!option) {
        option = document.createElement("option");
        select.prepend(option);
      }
      option.textContent = value;
      option.value = "";
      option.disabled = true;
      option.selected = select.selectedIndex <= 0;
    };

    const normalizeGuestOptions = (select: HTMLSelectElement) => {
      const selectedValue = String(Number(select.value || "0"));
      select.replaceChildren();
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.disabled = true;
      placeholder.selected = selectedValue === "0";
      placeholder.textContent = messages.guestPlaceholder;
      select.appendChild(placeholder);

      for (let count = 1; count <= 5; count += 1) {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = String(count);
        option.selected = selectedValue === String(count);
        select.appendChild(option);
      }
    };

    const ensureGuestLabel = (select: HTMLSelectElement, value: string) => {
      const wrapper = select.parentElement;
      if (!wrapper) {
        return;
      }

      let label = wrapper.querySelector<HTMLElement>(".rsvp-guest-label");
      if (!label) {
        label = document.createElement("p");
        label.className = "rsvp-guest-label";
        label.style.margin = "0 0 8px";
        label.style.fontSize = "14px";
        label.style.lineHeight = "1.5";
        wrapper.prepend(label);
      }

      label.textContent = value;
    };

    const localizeForm = () => {
      const titleWrapper = form.closest("#rsvp")?.querySelector<HTMLElement>(".wpo-section-title");
      const title = titleWrapper?.querySelector<HTMLHeadingElement>("h2");
      if (title) {
        title.textContent = messages.title;
      }
      if (titleWrapper) {
        let deadline = titleWrapper.querySelector<HTMLParagraphElement>(".rsvp-deadline-message");
        if (!deadline) {
          deadline = document.createElement("p");
          deadline.className = "rsvp-deadline-message";
          title?.after(deadline);
        }
        deadline.textContent = messages.deadline;
      }

      setPlaceholder("input[name='name']", messages.name);
      setPlaceholder("input[name='phone']", messages.phone);
      setLabel("label[for='attend']", messages.yes);
      setLabel("label[for='not']", messages.no);
      const guestSelect = form.querySelector<HTMLSelectElement>("select[name='guest']");
      if (guestSelect) {
        ensureGuestLabel(guestSelect, messages.guestHelp);
        normalizeGuestOptions(guestSelect);
      }

      if (submitButton) {
        submitButton.textContent = messages.submit;
      }
    };

    localizeForm();

    const setRadioDefaults = () => {
      const yesRadio = form.querySelector<HTMLInputElement>("#attend");
      const noRadio = form.querySelector<HTMLInputElement>("#not");
      if (yesRadio && !yesRadio.value) {
        yesRadio.value = "yes";
      }
      if (noRadio && !noRadio.value) {
        noRadio.value = "no";
      }
    };

    const toggleLoader = (visible: boolean) => {
      loader?.classList.toggle("visible", visible);
      if (submitButton) {
        submitButton.disabled = visible;
      }
    };

    const resetMessages = () => {
      statusTarget?.classList.remove("visible");
      errorTarget?.classList.remove("visible");
    };

    const showStatus = (type: SubmitState, message: string) => {
      state = type;
      if (type === "success" && statusTarget) {
        statusTarget.textContent = message;
        statusTarget.classList.add("visible");
      } else if (type === "error" && errorTarget) {
        errorTarget.textContent = message;
        errorTarget.classList.add("visible");
      }
    };

    const inviteParam = new URLSearchParams(window.location.search).get("invite");
    let inviteInput = form.querySelector<HTMLInputElement>("input[name='inviteCode']");
    if (!inviteInput) {
      inviteInput = document.createElement("input");
      inviteInput.type = "hidden";
      inviteInput.name = "inviteCode";
      form.appendChild(inviteInput);
    }
    inviteInput.value = inviteParam ?? "";

    const resolveAttendance = (): "yes" | "no" => {
      const selected = form.querySelector<HTMLInputElement>("input[name='radio-group']:checked");
      if (selected) {
        const raw = selected.value.toLowerCase();
        if (raw === "yes" || raw === "no") {
          return raw;
        }
        if (selected.id === "not") {
          return "no";
        }
      }
      return "yes";
    };

    const toggleAttendanceFields = () => {
      const attending = resolveAttendance();
      const hiddenWhenDeclined = [
        form.querySelector<HTMLElement>("select[name='guest']")?.parentElement,
      ].filter(Boolean) as HTMLElement[];

      hiddenWhenDeclined.forEach((element) => {
        element.style.display = attending === "no" ? "none" : "";
      });

      if (attending === "no") {
        const guestSelect = form.querySelector<HTMLSelectElement>("select[name='guest']");
        if (guestSelect) {
          guestSelect.selectedIndex = 0;
        }
      }
    };

    const attendanceRadios = form.querySelectorAll<HTMLInputElement>("input[name='radio-group']");
    attendanceRadios.forEach((radio) => {
      radio.addEventListener("change", toggleAttendanceFields);
    });

    const handler = async (event: Event) => {
      event.preventDefault();
      resetMessages();
      toggleLoader(true);

      const formData = new FormData(form);
      const attending = resolveAttendance();
      const payload = {
        name: (formData.get("name") ?? "").toString().trim(),
        phone: (formData.get("phone") ?? "").toString().trim(),
        attending,
        guestCount: attending === "yes" ? (formData.get("guest") ?? "").toString() : "0",
        inviteCode: (formData.get("inviteCode") ?? "").toString().trim(),
        locale,
      };

      try {
        const response = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json?.ok) {
          const message = json?.error ?? messages.errorDefault;
          throw new Error(message);
        }

        form.reset();
        setRadioDefaults();
        inviteInput!.value = inviteParam ?? "";
        toggleAttendanceFields();
        showStatus("success", messages.success);
      } catch (err) {
        console.error("RSVP submission failed", err);
        const message = err instanceof Error ? err.message : messages.unexpected;
        showStatus("error", message);
      } finally {
        toggleLoader(false);
      }
    };

    setRadioDefaults();
    toggleAttendanceFields();
    form.addEventListener("submit", handler);
    return () => {
      form.removeEventListener("submit", handler);
      attendanceRadios.forEach((radio) => {
        radio.removeEventListener("change", toggleAttendanceFields);
      });
    };
  }, [locale, messages]);

  return <div className="sr-only" aria-live="polite">Live RSVP status updates</div>;
}
