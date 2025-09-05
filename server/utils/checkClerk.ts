export function checkClerkEnv() {
  const pub = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  const sec = process.env.CLERK_SECRET_KEY;
  const problems: string[] = [];

  if (!pub) problems.push("Missing publishable key (use CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY or REACT_APP_CLERK_PUBLISHABLE_KEY).");
  if (!sec) problems.push("Missing CLERK_SECRET_KEY (server-side).");

  if (pub && !/^pk_(test|live)_/.test(pub)) problems.push("Publishable key format looks wrong (should start with pk_test_ or pk_live_).");
  if (sec && !/^sk_(test|live)_/.test(sec)) problems.push("Secret key format looks wrong (should start with sk_test_ or sk_live_).");

  // Helpful tip if keys are from different instances/environments.
  if (pub?.includes("_test_") && sec?.includes("_live_")) problems.push("Mismatch: publishable is TEST but secret is LIVE.");
  if (pub?.includes("_live_") && sec?.includes("_test_")) problems.push("Mismatch: publishable is LIVE but secret is TEST.");

  return { 
    ok: problems.length === 0, 
    problems, 
    pubMasked: pub ? pub.slice(0, 10) + "…" : "none", 
    secMasked: sec ? sec.slice(0, 10) + "…" : "none" 
  };
}