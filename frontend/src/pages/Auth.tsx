import React, { useState } from "react";
import { login, signup } from "../services/api";

/**
 * Auth APIs are provided by the services layer.
 * `login(email, password)` and `signup({ name, email, password })` are
 * imported from `../services/api`.
 */

/* Auth component with improved UI, responsiveness and simple validation */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const validate = () => {
    resetMessages();
    if (!form.email || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (!isLogin) {
      if (!form.name.trim()) {
        setError("Please enter your name for registration.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }
    return true;
  };

  const getErrorMessage = (err: unknown): string => {
    if (!err) return "An unexpected error occurred";
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null && "message" in err) {
      const candidate = (err as { message?: unknown }).message;
      if (typeof candidate === "string") return candidate;
    }
    return "An unexpected error occurred";
  };

  const extractErrorMessage = (err: unknown): string => {
    // Delegate to the typed helper to produce a user-friendly message.
    return getErrorMessage(err);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const res = await login(form.email, form.password);
        setSuccess(`Welcome back, ${res.user.email}`);
      } else {
        const res = await signup({
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setSuccess(`Account created for ${res.user.name} (${res.user.email})`);
      }
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left graphic / marketing panel - hidden on small screens */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-700 text-white items-center justify-center p-8">
          <div className="space-y-4 max-w-sm">
            <h2 className="text-3xl font-bold">Welcome to SnapLM</h2>
            <p className="text-indigo-100">
              Fast, simple authentication UI. Sign in to continue or create an
              account — this panel scales down on smaller devices.
            </p>
            <ul className="text-sm space-y-1">
              <li>• Responsive layout</li>
              <li>• Simple validation</li>
              <li>• Mock API integration</li>
            </ul>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full md:w-1/2 p-8 md:p-10">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-800">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </h3>
            <button
              onClick={() => {
                setIsLogin((s) => !s);
                resetMessages();
              }}
              className="text-sm text-indigo-600 hover:underline"
              aria-label="Toggle sign in or register"
            >
              {isLogin ? "Need an account?" : "Already registered?"}
            </button>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="mail@example.com"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Repeat your password"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 mb-3">{success}</p>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                    ? "Sign In"
                    : "Sign Up"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                  resetMessages();
                }}
                className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            By continuing you agree to our{" "}
            <span className="underline">Terms</span> and{" "}
            <span className="underline">Privacy Policy</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
