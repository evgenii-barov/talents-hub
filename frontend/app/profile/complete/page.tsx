"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";

import { AuthenticatedHeader } from "@/components/layout/authenticated-header";
import { useLocale } from "@/components/i18n/locale-provider";
import { ProfileBreadcrumbs } from "@/components/profile/profile-breadcrumbs";
import { Button } from "@/components/ui/button";
import { API_URL, ApiError, apiFetch } from "@/lib/api";
import type {
  City,
  Country,
  Profile,
} from "@/lib/contracts";
import { uploadProfileImage } from "@/lib/media";
import {
  createProfileLink,
  deleteProfileLink,
} from "@/lib/profile-editor";
import { notifyProfileUpdated } from "@/lib/profile-events";
import { getTaxonomy } from "@/lib/taxonomy";

const fieldClass =
  "mt-2 h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 font-inter text-sm outline-none focus:border-[var(--color-primary)]";
const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
    {children}
  </section>
);

export default function CompleteProfilePage() {
  const { taxonomyName, tr } = useLocale();
  const [profile, setProfile] = useState<Profile>();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState({ kind: "portfolio", url: "", label: "" });
  const load = useCallback(async () => {
    try {
      const next = await apiFetch<Profile>("/v1/me/profile/");
      setProfile(next);
      setCountry(next.country?.id ?? "");
      setCity(next.city?.id ?? "");
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 404
          ? tr(
              "Create your basic profile first.",
              "Сначала создайте основной профиль.",
            )
          : tr(
              "Sign in to complete your profile.",
              "Войдите, чтобы заполнить профиль.",
            ),
      );
    }
  }, [tr]);
  useEffect(() => {
    void getTaxonomy<Country>("countries")
      .then(setCountries)
      .catch(() =>
        setMessage(
          tr(
            "Could not load reference data.",
            "Не удалось загрузить справочные данные.",
          ),
        ),
      );
    void load();
  }, [load, tr]);
  useEffect(() => {
    if (!country) {
      setCities([]);
      return;
    }
    void getTaxonomy<City>("cities", { country })
      .then(setCities)
      .catch(() => setCities([]));
  }, [country]);
  async function saveLocation() {
    if (!profile) return;
    try {
      const next = await apiFetch<Profile>("/v1/me/profile/", {
        method: "PATCH",
        body: { country: country || null, city: city || null },
      });
      setProfile(next);
      setMessage(tr("Location saved.", "Местоположение сохранено."));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr(
              "Could not save location.",
              "Не удалось сохранить местоположение.",
            ),
      );
    }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const asset = await uploadProfileImage(file);
      const next = await apiFetch<Profile>("/v1/me/profile/", {
        method: "PATCH",
        body: { avatar: asset.id },
      });
      setProfile(next);
      notifyProfileUpdated(next);
      setMessage(tr("Avatar updated.", "Аватар обновлён."));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr("Could not upload image.", "Не удалось загрузить изображение."),
      );
    } finally {
      setUploading(false);
    }
  }
  async function addLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createProfileLink(link as Parameters<typeof createProfileLink>[0]);
      setLink({ kind: "portfolio", url: "", label: "" });
      await load();
      setMessage(tr("Link added.", "Ссылка добавлена."));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : tr("Could not add link.", "Не удалось добавить ссылку."),
      );
    }
  }
  const avatarUrl = profile?.avatar?.url
    ? profile.avatar.url.startsWith("http")
      ? profile.avatar.url
      : `${API_URL.replace(/\/api$/, "")}${profile.avatar.url}`
    : "";
  return (
    <div className="min-h-full bg-[var(--color-background)]">
      <AuthenticatedHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-7 md:py-9">
        <ProfileBreadcrumbs
          items={[
            { label: tr("Overview", "Обзор"), href: "/" },
            { label: tr("My profile", "Мой профиль"), href: "/profile" },
            { label: tr("Additional details", "Дополнительные сведения") },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-geist text-[28px] font-[650]">
              {tr("Complete profile", "Заполнение профиля")}
            </h1>
            <p className="mt-2 font-inter text-sm text-[var(--color-muted)]">
              {tr(
                "Add the information collaborators need before publication.",
                "Добавьте информацию, которая нужна участникам до публикации профиля.",
              )}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/profile/settings">
              {tr("Profile settings", "Настройки профиля")}
            </Link>
          </Button>
        </div>
        {message ? (
          <p className="mt-5 rounded-lg bg-[var(--color-soft-blue)] p-4 font-inter text-sm text-[var(--color-primary)]">
            {message}
          </p>
        ) : null}
        <div className="mt-5 space-y-[18px]">
          <Card>
            <h2 className="font-geist text-lg font-[650]">
              {tr("Avatar and location", "Аватар и местоположение")}
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={
                    profile?.avatar?.alt_text ||
                    tr("Profile avatar", "Аватар профиля")
                  }
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-[var(--color-primary)] font-geist text-xl font-bold text-white">
                  {profile?.display_name.slice(0, 2).toUpperCase() || "?"}
                </span>
              )}
              <label className="cursor-pointer rounded-md border border-[var(--color-border)] px-4 py-2 font-inter text-sm font-semibold">
                <Upload className="mr-2 inline" size={15} />
                {uploading
                  ? tr("Uploading…", "Загрузка…")
                  : tr("Upload avatar", "Загрузить аватар")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={!profile || uploading}
                  onChange={upload}
                />
              </label>
              <span className="font-inter text-xs text-[var(--color-muted)]">
                {tr(
                  "JPEG, PNG or WebP, up to 5 MB.",
                  "JPEG, PNG или WebP, до 5 МБ.",
                )}
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="font-inter text-[13px] font-semibold">
                {tr("Country", "Страна")}
                <select
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setCity("");
                  }}
                  className={fieldClass}
                >
                  <option value="">{tr("Not specified", "Не указана")}</option>
                  {countries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-inter text-[13px] font-semibold">
                {tr("City", "Город")}
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  disabled={!country}
                  className={fieldClass}
                >
                  <option value="">{tr("Not specified", "Не указан")}</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {taxonomyName(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              disabled={!profile}
              onClick={() => void saveLocation()}
            >
              {tr("Save location", "Сохранить местоположение")}
            </Button>
          </Card>
          <Card>
            <h2 className="font-geist text-lg font-[650]">
              {tr("Links", "Ссылки")}
            </h2>
            <div className="mt-4 space-y-2">
              {profile?.links.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-neutral-100 p-3"
                >
                  <a
                    className="truncate font-inter text-sm font-semibold text-[var(--color-primary)]"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label || item.url}
                  </a>
                  <button
                    type="button"
                    onClick={() => void deleteProfileLink(item.id).then(load)}
                    aria-label={tr("Delete link", "Удалить ссылку")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={addLink}
              className="mt-5 grid gap-3 md:grid-cols-[150px_1fr_1fr_auto]"
            >
              <select
                value={link.kind}
                onChange={(e) => setLink({ ...link, kind: e.target.value })}
                className={fieldClass}
              >
                <option value="portfolio">
                  {tr("Portfolio", "Портфолио")}
                </option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="website">{tr("Website", "Сайт")}</option>
                <option value="other">{tr("Other", "Другое")}</option>
              </select>
              <input
                required
                type="url"
                placeholder="https://"
                value={link.url}
                onChange={(e) => setLink({ ...link, url: e.target.value })}
                className={fieldClass}
              />
              <input
                placeholder={tr("Label", "Подпись")}
                value={link.label}
                onChange={(e) => setLink({ ...link, label: e.target.value })}
                className={fieldClass}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!profile}
                className="mt-2"
              >
                {tr("Add link", "Добавить ссылку")}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
