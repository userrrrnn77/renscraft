// src/utils/billingToast.jsx
//
// The toast shown when a generate / revision is rejected with 402 INSUFFICIENT_CREDITS.
// It carries a "Top up" button that opens the Buy credits modal.
import toast from "react-hot-toast";
// import { openBuyCredits } from "./billing";
import { openTopUp } from "./topup";

export function showInsufficientCreditsToast(message) {
  toast.error(
    (t) => (
      <div className="flex items-center gap-3 text-sm">
        <span>{message}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            openTopUp();
          }}
          className="shrink-0 cursor-pointer rounded-md bg-zinc-950 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800">
          Top up
        </button>
      </div>
    ),
    { duration: 8000 },
  );
}
