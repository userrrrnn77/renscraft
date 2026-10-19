import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context/AppContext";
import OAuthButtons from "../components/OAuthButtons";

const GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  maskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 70% 55% at 50% 40%, black 30%, transparent 100%)",
};

const CodeCard = ({ style, delay = "0s", lines, tone = "sky" }) => {
  const toneMap = {
    sky: "text-sky-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  const accent = toneMap[tone] ?? toneMap.sky;

  return (
    <div
      className="animate-float-slow absolute hidden lg:block"
      style={{
        ...style,
        animationDelay: delay,
        "--rot": `${style.rotate ?? 0}deg`,
      }}>
      <div className="w-64 rounded-xl border border-white/10 bg-white/3 backdrop-blur-xl p-3 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/5">
          <span className="size-2 rounded-full bg-red-400/70" />
          <span className="size-2 rounded-full bg-amber-400/70" />
          <span className="size-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[9px] font-medium uppercase tracking-widest text-zinc-500">
            Preview
          </span>
        </div>
        <pre className="font-mono text-[10px] leading-relaxed text-zinc-400 whitespace-pre-wrap break-all">
          {lines.map((line, i) => (
            <div key={i} className={i === 0 || line.accent ? accent : ""}>
              {line.t}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

const AuthBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,#0b1220_0%,#09090b_60%,#050507_100%)]" />
    <div className="absolute inset-0" style={GRID_STYLE} />
    <div className="animate-drift absolute -top-32 left-[12%] size-115 rounded-full bg-sky-500/10 blur-[120px]" />
    <div
      className="animate-drift absolute bottom-[-10%] right-[8%] size-105 rounded-full bg-violet-500/10 blur-[130px]"
      style={{ animationDelay: "3s" }}
    />
    <div className="absolute left-1/2 top-1/2 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[160px]" />

    <CodeCard
      style={{ top: "14%", left: "6%", rotate: -8 }}
      delay="0s"
      tone="sky"
      lines={[
        { t: '<div className="hero">' },
        { t: "  <h1>Hello world</h1>" },
        { t: "  <button>Get started</button>" },
        { t: "</div>" },
      ]}
    />
    <CodeCard
      style={{ bottom: "14%", right: "7%", rotate: 6 }}
      delay="2.5s"
      tone="violet"
      lines={[
        { t: "export default function App() {" },
        { t: "  return <Hero />;" },
        { t: "}" },
      ]}
    />
  </div>
);

const AuthPage = ({ mode }) => {
  const isLogin = mode === "login";
  const { t } = useTranslation();

  const { login, register } = useAppContext();

  const location = useLocation();
  const [error, setError] = useState(location.state?.authError || "");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && !agreed) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message || t("errors.AUTH_INVALID_CREDENTIALS"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans">
      <AuthBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-6 opacity-90 hover:opacity-100 transition">
              <img src="/logo.svg" alt="Renscraft" className="size-6" />
              <span className="text-base font-semibold tracking-tight text-zinc-50">
                Renscraft
              </span>
            </Link>
            <h1 className="text-3xl font-medium tracking-tight text-zinc-50">
              {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {isLogin ? t("auth.signInSubtitle") : t("auth.registerSubtitle")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-7 backdrop-blur-2xl shadow-2xl shadow-black/40">
            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <OAuthButtons
              disabled={loading}
              onError={setError}
              onStart={() => setError("")}
            />

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                    {t("auth.fullName")}
                  </label>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/4 focus:ring-1 focus:ring-white/20"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  {t("auth.email")}
                </label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/4 focus:ring-1 focus:ring-white/20"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="johndoe@gmail.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/2 px-3 py-2.5 pr-10 text-sm text-zinc-50 placeholder-zinc-500 outline-none transition focus:border-white/30 focus:bg-white/4 focus:ring-1 focus:ring-white/20"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword")
                        : t("auth.showPassword")
                    }>
                    {showPassword ? (
                      <EyeOffIcon size={15} />
                    ) : (
                      <EyeIcon size={15} />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-3.5 shrink-0 cursor-pointer rounded border-white/20 bg-white/5 text-white accent-white focus:ring-1 focus:ring-white/30"
                  />
                  <span className="text-[11px] leading-relaxed text-zinc-400">
                    {t("auth.agreePrefix")}{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white">
                      {t("auth.agreeTerms")}
                    </Link>{" "}
                    {t("auth.agreeAnd")}{" "}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white">
                      {t("auth.agreePrivacy")}
                    </Link>
                    {t("auth.agreeSuffix")}{" "}
                    <Link
                      to="/refund"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white">
                      {t("auth.agreeRefund")}
                    </Link>
                    .
                  </span>
                </label>
              )}

              <button
                className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer mt-2"
                type="submit"
                disabled={loading || (!isLogin && !agreed)}>
                {loading && (
                  <Loader2Icon className="animate-spin h-3.5 w-3.5 mr-2" />
                )}
                {isLogin ? t("auth.signIn") : t("auth.createAccountBtn")}
              </button>
            </form>

            <p className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-zinc-500">
              {isLogin ? (
                <>
                  {t("auth.newHere")}{" "}
                  <Link
                    to="/register"
                    className="font-medium text-zinc-200 hover:underline">
                    {t("auth.createAccountBtn")}
                  </Link>
                </>
              ) : (
                <>
                  {t("auth.haveAccount")}{" "}
                  <Link
                    to="/login"
                    className="font-medium text-zinc-200 hover:underline">
                    {t("auth.signIn")}
                  </Link>
                </>
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-600">
            {t("auth.footer")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
