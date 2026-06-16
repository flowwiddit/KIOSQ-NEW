import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-5">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#98763d]">KIOSQ</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Clerk supports Kakao and Naver OAuth when enabled in the Clerk dashboard.</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              cardBox: "shadow-none",
              card: "bg-transparent shadow-none"
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </main>
  );
}
