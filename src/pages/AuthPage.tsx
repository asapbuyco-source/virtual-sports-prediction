import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithRedirect,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import toast from "react-hot-toast";
import { APP_NAME, APP_TAGLINE } from "@/utils/constants";
import { useTranslation } from "@/lib/i18n/I18nContext";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = loginForm;
  const { register: registerRegister, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = registerForm;

  const getAuthErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      "auth/user-not-found": t.auth.userNotFound,
      "auth/wrong-password": t.auth.wrongPassword,
      "auth/email-already-in-use": t.auth.emailAlreadyInUse,
      "auth/weak-password": t.auth.weakPassword,
      "auth/invalid-email": t.auth.invalidEmail,
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later or reset your password.",
      "auth/network-request-failed": t.auth.networkError,
      "auth/popup-blocked": t.auth.popupBlocked,
      "auth/popup-closed-by-user": t.auth.popupClosed,
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
      "auth/unauthorized-domain": "This domain is not authorized for OAuth sign-in.",
      "auth/invalid-credential": t.auth.invalidEmail,
      "auth/requires-recent-sign-in": "Please sign in again before changing your password.",
      "auth/invalid-verification-code": "Invalid verification code.",
      "auth/invalid-phone-number": "Invalid phone number.",
    };
    return messages[code] || t.auth.signInFailed;
  };

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const code = err instanceof Error ? (err as any).code || "" : "";
      toast.error(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Account created! Welcome!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const code = err instanceof Error ? (err as any).code || "" : "";
      toast.error(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email || !email.includes("@")) {
      toast.error(t.auth.enterValidEmail);
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t.auth.resetPasswordSuccess);
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err instanceof Error ? (err as any).code || "" : ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const code = err instanceof Error ? (err as any).code || "" : "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch {
          toast.error(getAuthErrorMessage(code));
        }
      } else {
        toast.error(getAuthErrorMessage(code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-green-950/30 via-[#0a0a0f] to-[#0a0a0f] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-green-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-[128px]" />
        <div className="text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-black text-white mx-auto shadow-lg shadow-green-500/30">VA</div>
          <h2 className="text-4xl font-black text-white">{APP_NAME}</h2>
          <p className="text-gray-400 text-lg">{APP_TAGLINE}</p>
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-sm mx-auto">
            {["EPL", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Eredivisie"].map((l) => (
              <div key={l} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-gray-400 font-medium">{l}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-[#0a0a0f]">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="lg:hidden w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg font-black text-white mx-auto mb-4 shadow-lg shadow-green-500/20">VA</div>
            <h1 className="text-2xl font-black text-white">
              {isLogin ? t.auth.welcomeBack : t.auth.createAccount}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isLogin ? t.auth.signInToContinue : t.auth.startWithFree}
            </p>
          </div>

          <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${isLogin ? "bg-green-600 text-white shadow-md shadow-green-900/30" : "text-gray-500 hover:text-white"}`}
            >
              {t.auth.login}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${!isLogin ? "bg-green-600 text-white shadow-md shadow-green-900/30" : "text-gray-500 hover:text-white"}`}
            >
              {t.auth.register}
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLoginSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{t.auth.email}</label>
                <input
                  {...registerLogin("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors mt-1"
                  placeholder="you@example.com"
                />
                {loginErrors.email && <p className="text-xs text-red-400 mt-1">{loginErrors.email.message === "Email is required" ? t.auth.emailRequired : t.auth.invalidEmail}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{t.auth.password}</label>
                  <button type="button" onClick={() => handleForgotPassword(loginForm.getValues("email"))} className="text-[11px] text-green-400 hover:text-green-300 transition-colors">
                    {t.auth.forgotPassword}
                  </button>
                </div>
                <input
                  {...registerLogin("password")}
                  type="password"
                  autoComplete="current-password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors mt-1"
                  placeholder="••••••••"
                />
                {loginErrors.password && <p className="text-xs text-red-400 mt-1">{t.auth.passwordRequired}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-green-900/30 disabled:opacity-40 transition-all duration-300"
              >
                {loading ? t.auth.signingIn : t.auth.signIn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{t.auth.nameOptional}</label>
                <input
                  {...registerRegister("name")}
                  type="text"
                  autoComplete="name"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors mt-1"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{t.auth.email}</label>
                <input
                  {...registerRegister("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors mt-1"
                  placeholder="you@example.com"
                />
                {registerErrors.email && <p className="text-xs text-red-400 mt-1">{registerErrors.email.message === "Email is required" ? t.auth.emailRequired : t.auth.invalidEmail}</p>}
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{t.auth.password}</label>
                <input
                  {...registerRegister("password")}
                  type="password"
                  autoComplete="new-password"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors mt-1"
                  placeholder="••••••••"
                />
                {registerErrors.password && <p className="text-xs text-red-400 mt-1">{registerErrors.password.message}</p>}
                <p className="text-[10px] text-gray-600 mt-1">Min 8 chars with uppercase letter and number</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-green-900/30 disabled:opacity-40 transition-all duration-300"
              >
                {loading ? t.auth.creatingAccount : t.auth.createAccountBtn}
              </button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0a0a0f] px-3 text-gray-600">{t.auth.orContinueWith}</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t.auth.google}
          </button>

          <p className="text-center text-[11px] text-gray-600">
            {t.auth.termsAgree}
          </p>
        </div>
      </div>
    </div>
  );
}