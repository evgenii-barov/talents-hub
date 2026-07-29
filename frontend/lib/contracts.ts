export interface TaxonomyReference {
  id: string;
  name: string;
  slug: string;
}

export interface Country extends TaxonomyReference {
  code: string;
}

export interface City extends TaxonomyReference {
  country: Country;
}

export interface Language extends TaxonomyReference {
  code: string;
  native_name: string;
}

export interface ProfileSkill {
  id: string;
  skill: TaxonomyReference;
  level: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProfileLanguage {
  id: string;
  language: Language;
  proficiency: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProfileExperience {
  id: string;
  organization_name: string;
  title: string;
  location_text: string;
  work_format: TaxonomyReference | null;
  started_on: string;
  ended_on: string | null;
  is_current: boolean;
  description: string;
}

export interface ProfileEducation {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  education_level: TaxonomyReference | null;
  started_on: string;
  ended_on: string | null;
  credential_url: string;
  is_verified: boolean;
}

export interface ProfileLink {
  id: string;
  kind: "website" | "linkedin" | "portfolio" | "github" | "other";
  url: string;
  label: string;
}

export interface MediaAsset {
  id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  status: string;
  url: string;
}

export interface Profile {
  id: string;
  slug: string;
  display_name: string;
  headline: string;
  bio: string;
  country: Country | null;
  city: City | null;
  avatar: Pick<MediaAsset, "id" | "alt_text" | "url"> | null;
  availability: "available" | "limited" | "unavailable";
  availability_note: string;
  visibility?: "private" | "members" | "public";
  status?:
    | "draft"
    | "pending_moderation"
    | "published"
    | "changes_requested"
    | "archived"
    | "rejected";
  published_at?: string | null;
  moderated_at?: string | null;
  moderation_note?: string;
  remote_preference: TaxonomyReference | null;
  timezone: string;
  is_verified: boolean;
  skills: ProfileSkill[];
  languages: ProfileLanguage[];
  experiences: ProfileExperience[];
  education: ProfileEducation[];
  links: ProfileLink[];
  project_preferences: unknown[];
}

export interface OrganizationFocus {
  id: string;
  focus_area: TaxonomyReference;
  sort_order: number;
}

export interface Organization {
  id: string;
  slug: string;
  display_name: string;
  organization_type: string;
  tagline: string;
  description: string;
  website_url: string;
  country: Country | null;
  location_text: string;
  founded_year: number | null;
  is_verified: boolean;
  focuses: OrganizationFocus[];
}

export interface ProjectRole {
  id: string;
  title: string;
  description: string;
  first_responsibility: string;
  commitment_hours_per_week: number | null;
  seats_total: number;
  seats_filled: number;
  status: "open" | "paused" | "filled" | "closed";
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  organization: Pick<Organization, "id" | "slug" | "display_name"> | null;
  organization_name: string | null;
  owner_profile: Pick<Profile, "id" | "slug" | "display_name" | "avatar"> | null;
  category: TaxonomyReference;
  stage: string;
  problem_statement: string;
  goal_statement: string;
  expected_outcome: string;
  timeline_text: string;
  scope: string;
  work_format: TaxonomyReference;
  working_language: Language;
  starts_on: string | null;
  ends_on: string | null;
  application_deadline: string | null;
  is_featured: boolean;
  roles: ProjectRole[];
  focuses: Array<{ id: string; focus_area: TaxonomyReference }>;
  skills: Array<{ id: string; skill: TaxonomyReference; importance: string }>;
  contacts: Array<{ id: string; name: string; email: string; role_label: string }>;
}

export interface HealthResponse {
  status: "ok";
}
