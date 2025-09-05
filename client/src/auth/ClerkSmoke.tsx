import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

const pubKey = import.meta?.env?.VITE_CLERK_PUBLISHABLE_KEY || (window as any).REACT_APP_CLERK_PUBLISHABLE_KEY || (window as any).CLERK_PUBLISHABLE_KEY;

function WhoAmI() {
  const { user } = useUser();
  return (
    <pre style={{ padding: 12, background: "#111", color: "#eee", borderRadius: 8 }}>
      {JSON.stringify({
        signedIn: !!user,
        email: user?.primaryEmailAddress?.emailAddress,
        verified: user?.primaryEmailAddress?.verification?.status
      }, null, 2)}
    </pre>
  );
}

export default function ClerkSmoke() {
  if (!pubKey) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Clerk Smoke Test</h1>
        <p style={{ color: 'red' }}>Error: No Clerk publishable key found. Please check your environment variables.</p>
        <p>Looking for: VITE_CLERK_PUBLISHABLE_KEY</p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={pubKey}>
      <div style={{ padding: 24 }}>
        <h1>Clerk Smoke Test</h1>
        <p>Publishable Key: {pubKey.slice(0, 20)}...</p>
        <SignedOut>
          <p>You are signed out.</p>
          <SignInButton mode="modal">
            <button style={{ padding: '8px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <p>You are signed in.</p>
          <UserButton />
          <WhoAmI />
        </SignedIn>
      </div>
    </ClerkProvider>
  );
}