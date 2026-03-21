// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-canvas-bg flex items-center justify-center">
      <SignUp />
    </div>
  );
}
