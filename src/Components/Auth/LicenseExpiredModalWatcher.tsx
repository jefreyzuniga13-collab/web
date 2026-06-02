import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/Context";
import { LicenseExpiredModal } from "@/Components/Auth/LicenseExpiredModal";
import { markLicenseModalShown } from "@/Context/Slices/Auth/authSlice";

export function LicenseExpiredModalWatcher() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);

  const {
    isAuthenticated,
    checkingSession,
    licenseExpireAt,
    showLicenseWarning,
    showLicenseModalOnLogin,
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (checkingSession) return;
    if (!isAuthenticated) return;
    if (!showLicenseWarning) return;
    if (!showLicenseModalOnLogin) return;

    setOpen(true);
    dispatch(markLicenseModalShown());
  }, [
    checkingSession,
    isAuthenticated,
    showLicenseWarning,
    showLicenseModalOnLogin,
    dispatch,
  ]);

  if (!open) return null;

  return (
    <LicenseExpiredModal
      licenseExpireAt={licenseExpireAt}
      onClose={() => setOpen(false)}
    />
  );
}