import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2Icon, LockIcon, UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { adminLogin } from "../../api/admin";
import { errorMessage } from "../../api/api";
import usePageMeta from "../../utils/usePageMeta";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  usePageMeta({ title: "Admin — Renscraft", description: "Admin login", noIndex: true });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await adminLogin(number.trim(), password);
      toast.success("Welcome, admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/3 p-7 backdrop-blur-2xl">
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Renscraft
          </p>
          <h1 className="text-xl font-semibold tracking-tight">Admin access</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Restricted area. Only the site operator can sign in here.
          </p>
        </div>

        <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Number
        </label>
        <div className="relative mb-4">
          <UserIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            placeholder="08xxxxxxxxx"
            className="w-full rounded-lg border border-white/10 bg-white/2 pl-9 pr-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/5"
          />
        </div>

        <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Password
        </label>
        <div className="relative mb-6">
          <LockIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/2 pl-9 pr-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/5"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading && <Loader2Icon size={14} className="animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
