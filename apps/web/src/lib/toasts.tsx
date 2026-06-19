import { toast } from "sonner";

interface ProviderErrorToast {
  description?: string;
  id: string;
  title: string;
}

export const toasts = {
  account: {
    avatarFileTooLarge: () => toast.error("Avatar must be 2MB or smaller."),
    avatarInvalidType: () => toast.error("Avatar must be PNG, JPEG, or WebP."),
    avatarRemoved: () => toast("Avatar removed"),
    avatarSaved: () => toast("Avatar saved"),
    displayNameSaved: () => toast("Display name saved"),
    emailCodeSent: (email: string) => toast(`Code sent to ${email}`),
    emailExists: () => toast.error("A user already exists for this email."),
    emailVerified: () => toast("Email verified"),
    error: (message: string) => toast.error(message),
    missingPassphrase: () => toast.error("No passphrase is available."),
    passphraseCopied: () => toast("Passphrase copied"),
  },
  auth: {
    codeSent: (email: string) => toast(`Code sent to ${email}`),
    error: (message: string) => toast(message),
    invalidRecoveryPhrase: () => toast("Invalid recovery phrase"),
    missingAccount: () => toast("No account found for this email"),
    missingPassphraseProfile: () => toast("No rcode profile found for this passphrase"),
    missingRecoveryPhrase: () => toast("No recovery phrase is available yet"),
    recoveryPhraseCopied: () => toast("Recovery phrase copied. Save it before continuing."),
  },
  rooms: {
    archived: () => toast("Room archived", {
      description: "The room is now available from the Archived section.",
    }),
    linkCopied: (title: string, url: string) => toast(title, { description: url }),
    providerError: (error: ProviderErrorToast) => toast.error(error.title, {
      description: error.description,
      id: error.id,
    }),
    userJoined: (displayName: string) => toast.info(`${displayName} joined the room.`),
    userLeft: (displayName: string) => toast.info(`${displayName} left the room.`),
  },
} as const;
