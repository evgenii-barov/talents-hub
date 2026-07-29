import type { Profile } from "@/lib/contracts";
import { resolveMediaUrl } from "@/lib/media";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileAvatar({
  profile,
  className = "size-11 text-xs",
}: {
  profile: Pick<Profile, "display_name" | "avatar">;
  className?: string;
}) {
  const avatarUrl = resolveMediaUrl(profile.avatar?.url);

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-geist font-bold text-white`}
    >
      {avatarUrl ? (
        // Profile images are served by the configured backend media storage.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="size-full object-cover"
          src={avatarUrl}
          alt={profile.avatar?.alt_text || profile.display_name}
        />
      ) : (
        initials(profile.display_name)
      )}
    </span>
  );
}
