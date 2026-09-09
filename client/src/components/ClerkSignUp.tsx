import { SignUp } from "@clerk/clerk-react";

export default function ClerkSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join HiBowan</h1>
          <p className="mt-2 text-gray-600">Start your Sri Lankan adventure</p>
        </div>
        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    </div>
  );
}