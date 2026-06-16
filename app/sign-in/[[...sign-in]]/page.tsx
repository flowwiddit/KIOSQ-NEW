import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-5">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#98763d]">KIOSQ</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use email, Kakao, or Naver through Clerk authentication.</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              cardBox: "shadow-none",
              card: "bg-transparent shadow-none"
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </main>
  );
}
