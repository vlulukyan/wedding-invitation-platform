import { z } from "zod";

export const rsvpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Please share your name." })
    .max(120, { message: "Name must be 120 characters or fewer." }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Please share your last name." })
    .max(120, { message: "Last name must be 120 characters or fewer." }),
  attending: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Choose whether you can attend." }),
  }),
  guestCount: z
    .coerce.number({ invalid_type_error: "Tell us how many guests you are bringing." })
    .int({ message: "Guest count must be a whole number." })
    .min(0, { message: "Guest count must be 0 or more." })
    .max(5, { message: "We can accommodate up to 5 guests per RSVP." }),
  inviteCode: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  locale: z
    .string()
    .trim()
    .max(5)
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
}).superRefine((payload, ctx) => {
  if (payload.attending === "yes" && payload.guestCount < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["guestCount"],
      message: "Please bring at least 1 guest (you!).",
    });
  }
});

export type RsvpPayload = z.infer<typeof rsvpSchema>;
