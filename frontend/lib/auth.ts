import { apiFetch } from "@/lib/api";

export type Session =
  | { authenticated: false }
  | { authenticated: true; user: { id: string; email: string } };

export type SocialLoginProvider = {
  id: "google" | "github";
  login_url: string;
};

export function getSession() {
  return apiFetch<Session>("/v1/auth/session/");
}

export function getSocialLoginProviders() {
  return apiFetch<{ providers: SocialLoginProvider[] }>("/v1/auth/social/providers/");
}

export function signIn(email: string, password: string) {
  return apiFetch<Session>("/v1/auth/login/", { method: "POST", body: { email, password } });
}

export type SignupLegalConsents = {
  terms_accepted: boolean;
  personal_data_consent: boolean;
  age_confirmed: boolean;
};

export function signUp(
  email: string,
  password: string,
  legalConsents: SignupLegalConsents,
) {
  return apiFetch<{ email: string; email_verification_sent: boolean }>("/v1/auth/signup/", {
    method: "POST",
    body: {
      email,
      password,
      password_confirmation: password,
      ...legalConsents,
    },
  });
}

export function verifyEmail(uid: string, token: string) {
  return apiFetch<Session>("/v1/auth/verify-email/", { method: "POST", body: { uid, token } });
}

export function requestPasswordReset(email: string) {
  return apiFetch<void>("/v1/auth/password-reset/", { method: "POST", body: { email } });
}

export function confirmPasswordReset(uid: string, token: string, password: string) {
  return apiFetch<Session>("/v1/auth/password-reset/confirm/", {
    method: "POST",
    body: { uid, token, password, password_confirmation: password },
  });
}

export function signOut() {
  return apiFetch<Session>("/v1/auth/logout/", { method: "POST" });
}
