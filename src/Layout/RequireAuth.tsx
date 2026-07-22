import { type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "@/Context";
import { SupportRequestedPopup } from "@/Components/Hub/SupportRequestedPopup";
import { ConversationAssignedPopup } from "@/Components/Hub/ConversationAssignedPopup";
import { AssignmentResponsePopup } from "@/Components/Hub/AssignmentResponsePopup";
import { AssignmentForcedPopup } from "@/Components/Hub/AssignmentForcedPopup";
import ContactValidatorHub from "@/Components/Hub/ContactValidatorHub";
import { GlobalSoundNotifier } from "@/Components/Common/GlobalSoundNotifier";
import { NotificationsPopupBridge } from "@/Components/Chat/NotificationsPopupBridge";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();

  const { isAuthenticated, checkingSession } = useSelector(
    (state: RootState) => state.auth,
  );

  if (checkingSession) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <>
      <GlobalSoundNotifier />
      <NotificationsPopupBridge />
      <SupportRequestedPopup />
      <ConversationAssignedPopup />
      <AssignmentResponsePopup />
      <AssignmentForcedPopup />
      <ContactValidatorHub />

      {children}
    </>
  );
}