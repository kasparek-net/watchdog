import SignInForm from "./form";

export default function SignInPage() {
  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-sm text-neutral-500">
        Enter your email and we&apos;ll send you a 6-digit code plus a magic link.
      </p>
      <SignInForm />
    </div>
  );
}
