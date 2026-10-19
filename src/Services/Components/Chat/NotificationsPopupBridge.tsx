import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNotificationsHub } from "@/Hooks/Hub/useNotificationsHub";
import { enqueuePopup } from "@/Context/Slices/Chat/popupSlice";

export function NotificationsPopupBridge() {
  const dispatch = useDispatch();
  const event = useNotificationsHub();

  useEffect(() => {
    if (!event) return;

    dispatch(enqueuePopup(event));
  }, [event, dispatch]);

  return null;
}