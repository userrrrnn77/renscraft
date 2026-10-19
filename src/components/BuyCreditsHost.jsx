import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { onOpenBuyCredits } from "../utils/billing";
import BuyCreditsModal from "./BuyCreditsModal";

// Mounted once in App.jsx. Anything can open the modal with openBuyCredits()
// (utils/billing.js): the credit pills, the "Top up" toast after a 402.
//
// openBuyCredits(packageId) carries a package id: the modal then goes straight
// to checkout for that package, skipping the "pick a package" step. That is what
// the pricing page does (the user already clicked a specific plan card).
const BuyCreditsHost = () => {
  const { user } = useAppContext();
  const [open, setOpen] = useState(false);
  const [initialPackageId, setInitialPackageId] = useState(null);

  useEffect(
    () =>
      onOpenBuyCredits((event) => {
        setInitialPackageId(event?.detail?.packageId ?? null);
        setOpen(true);
      }),
    [],
  );

  // signing out (or a 401 while the modal is open) closes it
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setInitialPackageId(null);
    }
  }, [user]);

  const close = useCallback(() => {
    setOpen(false);
    setInitialPackageId(null);
  }, []);

  if (!open || !user) return null;
  return (
    <BuyCreditsModal onClose={close} initialPackageId={initialPackageId} />
  );
};

export default BuyCreditsHost;
