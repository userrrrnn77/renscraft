import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CoinsIcon,
  Loader2Icon,
  LogOutIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import {
  adminGrantCredits,
  adminListOrders,
  adminListProjects,
  adminListUsers,
  adminLogout,
  adminMe,
  adminStats,
} from "../../api/admin";
import { errorMessage } from "../../api/api";
import usePageMeta from "../../utils/usePageMeta";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";
import { BellIcon } from "lucide-react";

const fmtIdr = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

// ─── Reusable ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
        <ArrowLeftIcon size={12} />
        Prev
      </button>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
        Next
        <ArrowRightIcon size={12} />
      </button>
    </div>
  );
};

const StatCard = ({ label, value, sub, tone = "zinc" }) => {
  const tones = {
    zinc: "border-zinc-200 dark:border-zinc-800",
    emerald: "border-emerald-200 dark:border-emerald-500/30",
    sky: "border-sky-200 dark:border-sky-500/30",
  };
  return (
    <div
      className={`rounded-xl border bg-white p-5 dark:bg-zinc-950/60 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      )}
    </div>
  );
};

// ─── Overview ───────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [state, setState] = useState({ loading: true });

  const load = async () => {
    setState({ loading: true });
    try {
      const data = await adminStats();
      setState({ loading: false, data });
    } catch (err) {
      setState({
        loading: false,
        error: errorMessage(err, "Failed to load stats"),
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2Icon className="animate-spin text-zinc-400" />
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {state.error}
      </div>
    );
  }

  const { users, projects, payments } = state.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Users"
          value={users.total}
          sub={`+${users.last24h} today · +${users.last7d} this week`}
          tone="sky"
        />
        <StatCard
          label="Projects"
          value={projects.total}
          sub={`${projects.published} published · ${projects.failed} failed`}
        />
        <StatCard
          label="Revenue"
          value={fmtIdr(payments.revenue)}
          sub={`${payments.paidCount} paid · ${payments.pending} pending`}
          tone="emerald"
        />
      </div>

      <button
        type="button"
        onClick={load}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
        <RefreshCwIcon size={12} />
        Refresh
      </button>
    </div>
  );
};

// ─── Grant credits modal ────────────────────────────────────────────────────

const GrantCreditsModal = ({ user, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = parseInt(amount, 10);
    if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 10000) {
      toast.error("Amount must be a nonzero integer (max ±10000)");
      return;
    }
    setBusy(true);
    try {
      await adminGrantCredits(user._id, n, reason);
      toast.success(`${n > 0 ? "+" : ""}${n} credits → ${user.email}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to grant credits"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Adjust credits
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {user.name} · {user.email}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Balance:{" "}
              <strong className="text-zinc-900 dark:text-zinc-50">
                {user.credits}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
            <XIcon size={16} />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Amount (positive adds, negative subtracts)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
            placeholder="e.g. 50 or -10"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
          />
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="refund for order RSC-..."
            maxLength={200}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            {busy && <Loader2Icon size={12} className="animate-spin" />}
            Apply
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Users ──────────────────────────────────────────────────────────────────

const UsersTab = () => {
  const [state, setState] = useState({ loading: true, page: 1, q: "" });
  const [search, setSearch] = useState("");
  const [grantUser, setGrantUser] = useState(null);

  const load = async (page = 1, q = "") => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await adminListUsers({ page, limit: 25, q });
      setState({ loading: false, page, q, ...data });
    } catch (err) {
      setState({
        loading: false,
        page,
        q,
        error: errorMessage(err, "Failed to load users"),
      });
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(1, search.trim());
  };

  const totalPages = Math.max(1, Math.ceil((state.total || 0) / 25));

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left">User</th>
              <th className="px-4 py-2.5 text-left">Provider</th>
              <th className="px-4 py-2.5 text-right">Credits</th>
              <th className="px-4 py-2.5 text-left">Joined</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {state.loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-zinc-400">
                  <Loader2Icon className="inline animate-spin" />
                </td>
              </tr>
            ) : state.users?.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-xs text-zinc-400">
                  No users found.
                </td>
              </tr>
            ) : (
              state.users?.map((u) => (
                <tr
                  key={u._id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {u.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {u.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-900 dark:text-zinc-50">
                    {u.credits ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {moment(u.createdAt).format("DD MMM YYYY")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setGrantUser(u)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      <CoinsIcon size={11} />
                      Credits
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={state.page}
        totalPages={totalPages}
        onPage={(p) => load(p, state.q)}
      />

      {grantUser && (
        <GrantCreditsModal
          user={grantUser}
          onClose={() => setGrantUser(null)}
          onSuccess={() => load(state.page, state.q)}
        />
      )}
    </div>
  );
};

// ─── Projects ───────────────────────────────────────────────────────────────

const ProjectsTab = () => {
  const [state, setState] = useState({ loading: true, page: 1, status: "" });

  const load = async (page = 1, status = "") => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await adminListProjects({ page, limit: 25, status });
      setState({ loading: false, page, status, ...data });
    } catch (err) {
      setState({
        loading: false,
        page,
        status,
        error: errorMessage(err, "Failed to load projects"),
      });
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const totalPages = Math.max(1, Math.ceil((state.total || 0) / 25));
  const FILTERS = ["", "published", "busy", "failed"];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            type="button"
            onClick={() => load(1, f)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              state.status === f
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}>
            {f || "all"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left">Project</th>
              <th className="px-4 py-2.5 text-left">Owner</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-right">v</th>
              <th className="px-4 py-2.5 text-left">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {state.loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-zinc-400">
                  <Loader2Icon className="inline animate-spin" />
                </td>
              </tr>
            ) : state.projects?.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-xs text-zinc-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              state.projects?.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {p.name}
                    </p>
                    {p.published && (
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        PUBLISHED
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {p.owner?.name || "—"}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      {p.owner?.email || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        p.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : p.status === "failed"
                            ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                            : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    v{p.version}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {moment(p.updatedAt).fromNow()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={state.page}
        totalPages={totalPages}
        onPage={(p) => load(p, state.status)}
      />
    </div>
  );
};

// ─── Orders ─────────────────────────────────────────────────────────────────

const OrdersTab = () => {
  const [state, setState] = useState({ loading: true, page: 1, status: "" });

  const load = async (page = 1, status = "") => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await adminListOrders({ page, limit: 25, status });
      setState({ loading: false, page, status, ...data });
    } catch (err) {
      setState({
        loading: false,
        page,
        status,
        error: errorMessage(err, "Failed to load orders"),
      });
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const totalPages = Math.max(1, Math.ceil((state.total || 0) / 25));
  const FILTERS = [
    "",
    "pending",
    "paid",
    "expired",
    "failed",
    "refunded",
    "chargeback",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            type="button"
            onClick={() => load(1, f)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              state.status === f
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}>
            {f || "all"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left">Order</th>
              <th className="px-4 py-2.5 text-left">User</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {state.loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-zinc-400">
                  <Loader2Icon className="inline animate-spin" />
                </td>
              </tr>
            ) : state.orders?.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-xs text-zinc-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              state.orders?.map((o) => (
                <tr
                  key={o.orderId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-zinc-900 dark:text-zinc-50">
                      {o.orderId}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
                      {o.packageId} · {o.credits} credits
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      {o.owner?.name || "—"}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-500">
                      {o.owner?.email || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-zinc-900 dark:text-zinc-50">
                    {fmtIdr(o.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        o.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : o.status === "pending"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {moment(o.createdAt).format("DD MMM HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={state.page}
        totalPages={totalPages}
        onPage={(p) => load(p, state.status)}
      />
    </div>
  );
};

// ─── Manual transfers ───────────────────────────────────────────────────────

const ManualTab = () => {
  const [state, setState] = useState({ loading: true, status: "review" });
  const [actionOrder, setActionOrder] = useState(null); // { order, action: "approve"|"reject" }

  const load = async (status = "review") => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const p = new URLSearchParams({ status, page: "1", limit: "50" });
      const { data } = await (
        await import("../../api/api")
      ).default.get(`/api/admin/manual?${p}`);
      setState({
        loading: false,
        status,
        orders: data.orders || [],
        total: data.total,
      });
    } catch (err) {
      setState({
        loading: false,
        status,
        error: errorMessage(err, "Failed to load manual orders"),
      });
    }
  };

  useEffect(() => {
    load("review");
  }, []);

  const FILTERS = [
    { id: "review", label: "Needs review" },
    { id: "waiting_approval", label: "OCR passed" },
    { id: "manual_review", label: "Needs manual check" },
    { id: "paid", label: "Approved" },
    { id: "manual_rejected", label: "Rejected" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => load(f.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              state.status === f.id
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {state.loading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="animate-spin text-zinc-400" />
        </div>
      ) : state.orders?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">No orders in this bucket.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.orders.map((o) => (
            <div
              key={o.orderId}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {o.orderId}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        o.status === "waiting_approval"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : o.status === "manual_review"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            : o.status === "paid"
                              ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    Expected:{" "}
                    <strong className="font-mono">
                      {fmtIdr(o.expectedAmount)}
                    </strong>{" "}
                    · {o.credits} credits
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {o.owner?.name} · {o.owner?.email}
                  </p>
                  {o.manualName && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Sender: {o.manualName} ({o.manualBank})
                    </p>
                  )}
                  {o.ocrAllAmounts?.length > 0 && (
                    <p className="mt-1 text-xs">
                      OCR amounts:{" "}
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {o.ocrAllAmounts.map((a) => fmtIdr(a)).join(", ")}
                      </span>
                    </p>
                  )}
                  {o.flag && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      ⚠ {o.flag}
                    </p>
                  )}
                </div>

                {o.proofUrl && (
                  <a
                    href={o.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block shrink-0">
                    <img
                      src={o.proofUrl}
                      alt="Proof"
                      className="h-24 w-24 rounded-lg object-cover ring-1 ring-zinc-200 hover:ring-zinc-400 dark:ring-zinc-800"
                    />
                  </a>
                )}
              </div>

              {(o.status === "waiting_approval" ||
                o.status === "manual_review") && (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActionOrder({ order: o, action: "reject" })
                    }
                    className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10">
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActionOrder({ order: o, action: "approve" })
                    }
                    className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                    Approve & credit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {actionOrder && (
        <AdminManualActionModal
          order={actionOrder.order}
          action={actionOrder.action}
          onClose={() => setActionOrder(null)}
          onSuccess={() => {
            setActionOrder(null);
            load(state.status);
          }}
        />
      )}
    </div>
  );
};

const AdminManualActionModal = ({ order, action, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const label = "rendy"; // Ganti kalau multi-admin
      if (action === "approve") {
        await (
          await import("../../api/api")
        ).default.post(`/api/admin/manual/${order.orderId}/approve`, { label });
        toast.success(`Credited ${order.credits} to ${order.owner?.email}`);
      } else {
        if (!reason.trim()) {
          toast.error("Reason is required");
          setBusy(false);
          return;
        }
        await (
          await import("../../api/api")
        ).default.post(`/api/admin/manual/${order.orderId}/reject`, {
          reason: reason.trim(),
          label,
        });
        toast.success("Rejected");
      }
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}>
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold">
          {action === "approve" ? "Approve transfer?" : "Reject transfer?"}
        </h3>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {action === "approve"
            ? `Ini bakal nambah ${order.credits} credits ke ${order.owner?.email}.`
            : "User bakal notis ada masalah. Kasih alasan yang jelas."}
        </p>

        {action === "reject" && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Mis. nominal tidak sesuai, bukti tidak jelas, dll."
            className="mt-4 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${
              action === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}>
            {busy && <Loader2Icon size={12} className="animate-spin" />}
            {action === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard shell ────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "projects", label: "Projects" },
  { id: "orders", label: "Orders" },
  { id: "manual", label: "Manual" },
];

const AdminDashboardPage = () => {
  useAdminNotifications();

  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("overview");

  usePageMeta({ title: "Admin — Renscraft", description: "Admin dashboard" });

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then(() => {
        if (!cancelled) setChecking(false);
      })
      .catch(() => {
        if (!cancelled) navigate("/admin/login", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const logout = async () => {
    await adminLogout().catch(() => {});
    navigate("/admin/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2Icon className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt=""
              className="size-5 invert dark:invert-0"
            />
            <span className="text-sm font-semibold tracking-tight">Admin</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              restricted
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!("Notification" in window))
                  return toast.error("Browser tidak mendukung notifikasi");
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                  toast.success("Notifikasi berhasil diaktifkan!");
                } else {
                  toast.error("Izin notifikasi ditolak.");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <BellIcon size={12} />
              Aktifkan Notif
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <LogOutIcon size={12} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex gap-1.5 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "projects" && <ProjectsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "manual" && <ManualTab />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
