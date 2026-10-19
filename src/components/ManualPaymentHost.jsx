// src/components/ManualPaymentHost.jsx

import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { onOpenManualPayment } from "../utils/manualBilling";
import ManualPaymentModal from "./ManualPaymentModal";

const ManualPaymentHost = () => {
  const { user } = useAppContext();
  const [open, setOpen] = useState(false);
  const [initialPackageId, setInitialPackageId] = useState(null);

  useEffect(
    () =>
      onOpenManualPayment((event) => {
        setInitialPackageId(event?.detail?.packageId ?? null);
        setOpen(true);
      }),
    [],
  );

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
    <ManualPaymentModal onClose={close} initialPackageId={initialPackageId} />
  );
};

export default ManualPaymentHost;
