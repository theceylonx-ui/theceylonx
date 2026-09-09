/**
 * Whether a freshly-signed-in user should be routed through onboarding
 * (profile + travel preferences) instead of straight to the home page.
 */
export function needsOnboarding(user: any): boolean {
  if (!user) return false;
  const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
  const isRecentAccount = createdAt > 0 && Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
  const profileIncomplete = (user.profileCompletePct ?? 0) < 30;
  return isRecentAccount && profileIncomplete;
}
