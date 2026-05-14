"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  otpLoginSchema,
  passwordLoginSchema,
  signupPhoneSchema,
  type OtpLoginInput,
  type PasswordLoginInput,
  type SignupPhoneInput,
} from "@/lib/validations/auth";

type Mode = "login" | "signup";

type Step = "collect" | "otp";

type LoginMethod = "otp" | "password";

export function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("collect");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("otp");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loginForm = useForm<OtpLoginInput>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { phone: "", otp: "" },
  });

  const signupForm = useForm<SignupPhoneInput>({
    resolver: zodResolver(signupPhoneSchema),
    defaultValues: {
      shopName: "",
      name: "",
      phone: "",
      otp: "",
    },
  });

  const passwordLoginForm = useForm<PasswordLoginInput>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const phoneWatchLogin = loginForm.watch("phone");
  const phoneWatchSignup = signupForm.watch("phone");

  function resetFlow(nextMode: Mode) {
    setMode(nextMode);
    setStep("collect");
    setLoginMethod("otp");
    setFormError(null);
    loginForm.reset({ phone: "", otp: "" });
    passwordLoginForm.reset({ phone: "", password: "" });
    signupForm.reset({
      shopName: "",
      name: "",
      phone: "",
      otp: "",
    });
  }

  async function requestOtp(intent: "login" | "signup") {
    setFormError(null);
    const phone =
      intent === "login" ? loginForm.getValues("phone") : signupForm.getValues("phone");
    if (!phone?.trim()) {
      setFormError("মোবাইল নম্বর দিন");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), intent }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setFormError(data.error ?? "OTP পাঠানো যায়নি");
        return;
      }
      setStep("otp");
    } finally {
      setPending(false);
    }
  }

  async function onLogin(values: OtpLoginInput) {
    setFormError(null);
    setPending(true);
    try {
      const res = await signIn("phone-otp", {
        phone: values.phone.trim(),
        otp: values.otp.trim(),
        redirect: false,
      });
      if (res?.error) {
        setFormError("OTP ভুল বা মেয়াদ শেষ");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onLoginPassword(values: PasswordLoginInput) {
    setFormError(null);
    setPending(true);
    try {
      const res = await signIn("phone-password", {
        phone: values.phone.trim(),
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        setFormError("মোবাইল বা পাসওয়ার্ড ভুল");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onSignup(values: SignupPhoneInput) {
    setFormError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: values.shopName.trim(),
          name: values.name.trim(),
          phone: values.phone.trim(),
          otp: values.otp.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "সাইন আপ ব্যর্থ হয়েছে");
        return;
      }
      const sign = await signIn("phone-otp", {
        phone: values.phone.trim(),
        otp: values.otp.trim(),
        redirect: false,
      });
      if (sign?.error) {
        setFormError("অ্যাকাউন্ট তৈরি হয়েছে। একই OTP দিয়ে লগ ইন চেষ্টা করুন।");
        setMode("login");
        setStep("otp");
        loginForm.setValue("phone", values.phone.trim());
        loginForm.setValue("otp", values.otp.trim());
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-0">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Dokandar.app</p>
        <h1 className="text-balance text-3xl font-bold tracking-tight">দোকানদার লগইন</h1>
        <p className="text-pretty text-base text-muted-foreground">
          মোবাইল নম্বর ও OTP — দ্রুত ও নিরাপদ।
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5"
        role="tablist"
        aria-label="লগইন বা সাইন আপ"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={cn(
            "min-h-[3rem] rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mode === "login"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => resetFlow("login")}
        >
          লগ ইন
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={cn(
            "min-h-[3rem] rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            mode === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => resetFlow("signup")}
        >
          নতুন অ্যাকাউন্ট
        </button>
      </div>

      {process.env.NODE_ENV !== "production" ? (
        <p className="rounded-xl border border-dashed bg-muted/40 px-3 py-2 text-center text-sm text-muted-foreground">
          ডেভ: মোক OTP <span className="font-mono font-semibold">123456</span> (প্রোডাকশনে
          বন্ধ থাকবে)
        </p>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-base text-destructive"
        >
          {formError}
        </div>
      ) : null}

      {mode === "login" ? (
        loginMethod === "password" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={passwordLoginForm.handleSubmit(onLoginPassword)}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="login-pw-phone" className="text-base font-medium">
                মোবাইল
              </label>
              <Input
                id="login-pw-phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="০১৮৩২৯৯৭০৮০"
                aria-invalid={!!passwordLoginForm.formState.errors.phone}
                {...passwordLoginForm.register("phone")}
              />
              {passwordLoginForm.formState.errors.phone ? (
                <p className="text-sm text-destructive">
                  {passwordLoginForm.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="login-pw" className="text-base font-medium">
                পাসওয়ার্ড
              </label>
              <Input
                id="login-pw"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!passwordLoginForm.formState.errors.password}
                {...passwordLoginForm.register("password")}
              />
              {passwordLoginForm.formState.errors.password ? (
                <p className="text-sm text-destructive">
                  {passwordLoginForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              className="mt-2 h-14 w-full rounded-2xl text-lg font-semibold"
              disabled={pending}
            >
              {pending ? "অপেক্ষা করুন…" : "লগ ইন করুন"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl"
              disabled={pending}
              onClick={() => {
                setLoginMethod("otp");
                passwordLoginForm.reset({ phone: "", password: "" });
              }}
            >
              OTP দিয়ে লগইন
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={loginForm.handleSubmit(onLogin)}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="login-phone" className="text-base font-medium">
                মোবাইল
              </label>
              <Input
                id="login-phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="০১৭১২৩৪৫৬৭৮"
                disabled={step === "otp"}
                aria-invalid={!!loginForm.formState.errors.phone}
                {...loginForm.register("phone")}
              />
              {loginForm.formState.errors.phone ? (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.phone.message}
                </p>
              ) : null}
            </div>

            {step === "otp" ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="login-otp" className="text-base font-medium">
                    OTP
                  </label>
                  <Input
                    id="login-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="৬ সংখ্যা"
                    aria-invalid={!!loginForm.formState.errors.otp}
                    {...loginForm.register("otp")}
                  />
                  {loginForm.formState.errors.otp ? (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.otp.message}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  className="mt-2 h-14 w-full rounded-2xl text-lg font-semibold"
                  disabled={pending}
                >
                  {pending ? "অপেক্ষা করুন…" : "লগ ইন করুন"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl"
                  disabled={pending}
                  onClick={() => {
                    setStep("collect");
                    loginForm.setValue("otp", "");
                  }}
                >
                  নম্বর বদলাবেন?
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="mt-2 h-14 w-full rounded-2xl text-lg font-semibold"
                  disabled={pending || !phoneWatchLogin?.trim()}
                  onClick={() => void requestOtp("login")}
                >
                  {pending ? "অপেক্ষা করুন…" : "OTP পাঠান"}
                </Button>
                <button
                  type="button"
                  className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setLoginMethod("password");
                    setStep("collect");
                    loginForm.setValue("otp", "");
                  }}
                >
                  পাসওয়ার্ড দিয়ে লগইন
                </button>
              </>
            )}
          </form>
        )
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={signupForm.handleSubmit(onSignup)}
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="signup-shop" className="text-base font-medium">
              দোকানের নাম
            </label>
            <Input
              id="signup-shop"
              autoComplete="organization"
              placeholder="যেমন: রহমান স্টোর"
              disabled={step === "otp"}
              aria-invalid={!!signupForm.formState.errors.shopName}
              {...signupForm.register("shopName")}
            />
            {signupForm.formState.errors.shopName ? (
              <p className="text-sm text-destructive">
                {signupForm.formState.errors.shopName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-base font-medium">
              আপনার নাম
            </label>
            <Input
              id="signup-name"
              autoComplete="name"
              disabled={step === "otp"}
              aria-invalid={!!signupForm.formState.errors.name}
              {...signupForm.register("name")}
            />
            {signupForm.formState.errors.name ? (
              <p className="text-sm text-destructive">
                {signupForm.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-phone" className="text-base font-medium">
              মোবাইল
            </label>
            <Input
              id="signup-phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="০১৭১২৩৪৫৬৭৮"
              disabled={step === "otp"}
              aria-invalid={!!signupForm.formState.errors.phone}
              {...signupForm.register("phone")}
            />
            {signupForm.formState.errors.phone ? (
              <p className="text-sm text-destructive">
                {signupForm.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          {step === "otp" ? (
            <>
              <div className="space-y-2">
                <label htmlFor="signup-otp" className="text-base font-medium">
                  OTP
                </label>
                <Input
                  id="signup-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="৬ সংখ্যা"
                  aria-invalid={!!signupForm.formState.errors.otp}
                  {...signupForm.register("otp")}
                />
                {signupForm.formState.errors.otp ? (
                  <p className="text-sm text-destructive">
                    {signupForm.formState.errors.otp.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="mt-2 h-14 w-full rounded-2xl text-lg font-semibold"
                disabled={pending}
              >
                {pending ? "অপেক্ষা করুন…" : "অ্যাকাউন্ট খুলুন"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                disabled={pending}
                onClick={() => {
                  setStep("collect");
                  signupForm.setValue("otp", "");
                }}
              >
                উপরের তথ্য বদলাবেন?
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="mt-2 h-14 w-full rounded-2xl text-lg font-semibold"
              disabled={pending || !phoneWatchSignup?.trim()}
              onClick={() => void requestOtp("signup")}
            >
              {pending ? "অপেক্ষা করুন…" : "OTP পাঠান"}
            </Button>
          )}
        </form>
      )}

      <Button asChild variant="ghost" className="h-12 text-base">
        <Link href="/">← হোমে ফিরে যান</Link>
      </Button>
    </div>
  );
}
