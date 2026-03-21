// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-canvas-bg flex items-center justify-center">
      <SignIn />
    </div>
  );
}
