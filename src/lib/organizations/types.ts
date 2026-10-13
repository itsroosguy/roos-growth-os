export type OrganizationRole = "owner" | "admin" | "staff";

export type OrganizationMemberStatus = "active" | "invited" | "suspended";

export type PlanTier = "starter" | "growth" | "business";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  plan_tier: PlanTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  role: OrganizationRole;
  invited_email?: string | null;
  status: OrganizationMemberStatus;
  joined_at?: string | null;
  created_at: string;
  user_profile?: {
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}
