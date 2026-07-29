import type { Profile } from "@/lib/contracts";

export const PROFILE_UPDATED_EVENT = "talents-hub:profile-updated";

export function notifyProfileUpdated(profile: Profile) {
  window.dispatchEvent(
    new CustomEvent<Profile>(PROFILE_UPDATED_EVENT, { detail: profile }),
  );
}
