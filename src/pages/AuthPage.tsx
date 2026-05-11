import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import toast from "react-hot-toast";
import { APP_NAME, APP_TAGLINE } from "@/utils/constants";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Need uppercase").regex(/[0-9]/, "Need number"),
  name: z.string().optional(),
});

type AuthForm = z.infer<typeof schema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<AuthForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: AuthForm) => {
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast.success("Welcome back!");
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast.success("Account created!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch {
          toast.error("Redirect sign-in also failed");
        }
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-green-900/30 to-gray-900 items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="text-8xl font-bold text-green-400">AI</div>
          <h2 className="text-3xl font-extrabold text-white">{APP_NAME}</h2>
          <p className="text-gray-400">{APP_TAGLINE}</p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {["EPL", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Eredivisie"].map((l) => (
              <div key={l} className="bg-gray-800/50 rounded-lg px-3 py-2 text-xs text-gray-300">{l}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-extrabold text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isLogin ? "Sign in to continue" : "Start with 5 free predictions"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${isLogin ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${!isLogin ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-gray-400">Name</label>
                <input
                  {...register("name")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400">Email</label>
              <input
                {...register("email")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400">Password</label>
              <input
                {...register("password")}
                type="password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>
            {isLogin && (
              <button type="button" onClick={() => handleForgotPassword("")} className="text-xs text-green-400 hover:underline">
                Forgot Password?
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold disabled:opacity-40"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-950 px-2 text-gray-500">or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-700 flex items-center justify-center gap-2"
          >
            <span>🔵</span> Google
          </button>

          <p className="text-center text-xs text-gray-500">
            By signing in you agree to our Terms
          </p>
        </div>
      </div>
    </div>
  );
}