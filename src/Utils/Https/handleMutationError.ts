import { toast } from "react-toastify";
import { formatErrorMessage } from "@/Utils/Https/formatErrorMessage";

export function handleMutationError(error: unknown): void {
  toast.error(formatErrorMessage(error));
}