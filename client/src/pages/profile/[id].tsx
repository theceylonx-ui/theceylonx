import { useRoute } from "wouter";
import { useEffect } from "react";
import ProfilePage from "@/pages/me";

// This is a wrapper component that handles /profile/:id routes
// and passes the user ID to the existing ProfilePage component
export default function UserProfilePage() {
  const [match, params] = useRoute("/profile/:id");
  
  if (!match || !params?.id) {
    return <div>Profile not found</div>;
  }

  // For now, we'll render the existing ProfilePage component
  // In a full implementation, you might want to check if the ID matches the current user
  // or fetch the profile data for the specified user ID
  return <ProfilePage />;
}