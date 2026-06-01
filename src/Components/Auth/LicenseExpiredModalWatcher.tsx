import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/Context";
import { LicenseExpiredModal } from "@/Components/Auth/LicenseExpiredModal";

export function LicenseExpiredModalWatcher() {
  const [open, setOpen] = useState(false);

  const {
    isAuthenticated,
    checkingSession,
    licenseExpireAt,
    showLicenseWarning,
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (checkingSession) return;
    if (!isAuthenticated) return;

    const flag = localStorage.getItem("showLicenseModalAfterLogin");

    if (flag !== "1") return;

    if (!showLicenseWarning) {
      localStorage.removeItem("showLicenseModalAfterLogin");
      return;
    }

    localStorage.removeItem("showLicenseModalAfterLogin");
    setOpen(true);
  }, [
    checkingSession,
    isAuthenticated,
    licenseExpireAt,
    showLicenseWarning,
  ]);

  if (!open) return null;

  return (
    <LicenseExpiredModal
      licenseExpireAt={licenseExpireAt}
      onClose={() => setOpen(false)}
    />
  );
}