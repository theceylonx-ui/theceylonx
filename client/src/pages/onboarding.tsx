import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { ArrowRight, MapPin } from "lucide-react";
import newLogo from "@assets/hibowan-pin-hi-mark.svg";

type Step = "profile" | "preferences";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("profile");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocationField] = useState(user?.location || "");
  const [isSaving, setIsSaving] = useState(false);

  const finish = () => {
    navigate("/");
  };

  const saveProfileAndContinue = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/me/profile", { displayName, bio, location });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setStep("preferences");
    } catch (error) {
      toast({
        title: "Couldn't save your profile",
        description: "You can try again, or skip for now and fill this in later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ui-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src={newLogo} alt="HiBowan" className="h-12 w-auto mx-auto mb-4" width="48" height="48" />
          <h1 className="text-2xl font-bold text-text-primary">Welcome to HiBowan</h1>
          <p className="text-text-secondary mt-1">A couple of quick things before you start exploring.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6" data-testid="onboarding-steps">
          <div className={`h-1.5 w-16 rounded-full ${step === "profile" ? "bg-brand" : "bg-brand/40"}`} />
          <div className={`h-1.5 w-16 rounded-full ${step === "preferences" ? "bg-brand" : "bg-ui-line"}`} />
        </div>

        {step === "profile" ? (
          <Card data-testid="onboarding-step-profile">
            <CardHeader>
              <CardTitle>Tell fellow travellers a bit about you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="onboarding-name">Display name</Label>
                <Input
                  id="onboarding-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should other travellers see you?"
                  data-testid="input-display-name"
                />
              </div>
              <div>
                <Label htmlFor="onboarding-location">Where are you based / travelling from?</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    id="onboarding-location"
                    value={location}
                    onChange={(e) => setLocationField(e.target.value)}
                    placeholder="e.g. Berlin, Germany"
                    className="pl-9"
                    data-testid="input-location"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="onboarding-bio">A short bio</Label>
                <Textarea
                  id="onboarding-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What kind of trips are you looking for?"
                  className="min-h-[90px]"
                  data-testid="input-bio"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={finish} data-testid="button-skip-profile">
                  Skip for now
                </Button>
                <Button
                  onClick={saveProfileAndContinue}
                  disabled={isSaving}
                  className="bg-brand hover:bg-brand-hover text-white"
                  data-testid="button-continue-to-preferences"
                >
                  {isSaving ? "Saving..." : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div data-testid="onboarding-step-preferences">
            <p className="text-sm text-text-secondary mb-4 text-center">
              Set your travel preferences so HiBowan can surface trips that actually fit you. You can always change these later from your profile.
            </p>
            <PreferencesForm />
            <p className="text-center mt-4">
              <button
                onClick={finish}
                className="text-sm text-text-muted hover:text-text-secondary underline underline-offset-2"
                data-testid="button-skip-preferences"
              >
                Skip for now — I'll set these later
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
