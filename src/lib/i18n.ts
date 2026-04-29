import type { Locale } from "@/lib/locales";

const messages = {
  en: {
    languageLabel: "Language",
    music: {
      enter: "Open invitation",
      play: "Play music",
      pause: "Pause music",
      playing: "Background music is playing.",
      paused: "Background music is paused.",
      ready: "Tap play to add a soft piano loop.",
      loading: "Loading background music.",
      enable: "Enable sound to hear the instrumental background loop.",
    },
    rsvp: {
      title: "Are You Attending?",
      deadline: "Please respond regarding your attendance by June 30.",
      name: "Name",
      phone: "Phone",
      yes: "Yes, I will be there",
      no: "Sorry, I can't come",
      guestHelp: "Please select how many guests will attend with you.",
      guestPlaceholder: "Number Of Guests",
      submit: "Send",
      success: "Thank you! Your RSVP has been saved.",
      errorDefault: "Unable to send your RSVP right now.",
      unexpected: "Unexpected error.",
    },
    countdown: {
      days: "Days",
      hours: "Hours",
      minutes: "Mins",
      seconds: "Secs",
    },
    admin: {
      locales: {
        en: "English",
        hy: "Armenian",
        de: "German",
      },
    },
  },
  hy: {
    languageLabel: "Լեզու",
    music: {
      enter: "Բացել հրավիրատոմսը",
      play: "Միացնել երաժշտությունը",
      pause: "Դադարեցնել երաժշտությունը",
      playing: "Ֆոնային երաժշտությունը միացված է",
      paused: "Ֆոնային երաժշտությունը դադարեցված է",
      ready: "Սեղմեք նվագարկել՝ մեղմ երաժշտություն լսելու համար",
      loading: "Ֆոնային երաժշտությունը բեռնվում է",
      enable: "Միացրեք ձայնը՝ ֆոնային երաժշտությունը լսելու համար",
    },
    rsvp: {
      title: "Մասնակցու՞մ եք",
      deadline: "Խնդրում ենք մինչեւ հունիսի 30-ը պատասխանել մասնակցության վերաբերյալ",
      name: "Անուն",
      phone: "Հեռախոս",
      yes: "Այո, ներկա կլինեմ",
      no: "Ցավում եմ, չեմ կարող գալ",
      guestHelp: "Խնդրում ենք ընտրել, թե քանի հյուր է գալու ձեզ հետ։",
      guestPlaceholder: "Հյուրերի քանակ",
      submit: "Ուղարկել",
      success: "Շնորհակալություն, ձեր պատասխանը պահպանվել է",
      errorDefault: "Հնարավոր չէ ուղարկել RSVP-ը հիմա",
      unexpected: "Անսպասելի սխալ",
    },
    countdown: {
      days: "Օր",
      hours: "Ժամ",
      minutes: "Րոպե",
      seconds: "Վրկ",
    },
    admin: {
      locales: {
        en: "Անգլերեն",
        hy: "Հայերեն",
        de: "Գերմաներեն",
      },
    },
  },
  de: {
    languageLabel: "Sprache",
    music: {
      enter: "Einladung öffnen",
      play: "Musik abspielen",
      pause: "Musik pausieren",
      playing: "Die Hintergrundmusik läuft.",
      paused: "Die Hintergrundmusik ist pausiert.",
      ready: "Tippe auf Play, um eine sanfte Melodie zu hören.",
      loading: "Hintergrundmusik wird geladen.",
      enable: "Aktiviere den Ton, um die Musik zu hören.",
    },
    rsvp: {
      title: "Nehmen Sie teil?",
      deadline: "Bitte antworten Sie bis zum 30. Juni bezüglich Ihrer Teilnahme.",
      name: "Name",
      phone: "Telefon",
      yes: "Ja, ich bin dabei",
      no: "Leider kann ich nicht kommen",
      guestHelp: "Bitte wähle aus, mit wie vielen Gästen du teilnehmen wirst.",
      guestPlaceholder: "Anzahl der Gäste",
      submit: "Senden",
      success: "Danke! Deine Zusage wurde gespeichert.",
      errorDefault: "Antwort konnte gerade nicht gesendet werden.",
      unexpected: "Unerwarteter Fehler",
    },
    countdown: {
      days: "Tage",
      hours: "Stunden",
      minutes: "Min.",
      seconds: "Sek.",
    },
    admin: {
      locales: {
        en: "Englisch",
        hy: "Armenisch",
        de: "Deutsch",
      },
    },
  },
} as const;

export type UiMessages = (typeof messages)[Locale];

export function getUiMessages(locale: Locale): UiMessages {
  return messages[locale] ?? messages.en;
}
