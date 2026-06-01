import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/Context";
import { setCredentials, logout as clearAuth } from "@/Context/Slices/Auth/authSlice";
import { QUERY_KEYS } from "@/Constants/queryKeys";
import type { ApiResponse, AuthData, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyEmailRequest, LogOutAtResponseDto,} from "@/Interfaces/Auth/AuthInterface";
import { authService } from "@/Services/auth/AuthService";
import { formatErrorMessage } from "@/Utils/Https/formatErrorMessage";

type UseAuthHook = {
  login: (payload: LoginRequest) => Promise<ApiResponse<AuthData>>;
  registerAsync: (payload: RegisterRequest) => Promise<ApiResponse<string>>;
  forgotPasswordAsync: (
    payload: ForgotPasswordRequest
  ) => Promise<ApiResponse<string>>;
  resetPasswordAsync: (
    payload: ResetPasswordRequest
  ) => Promise<ApiResponse<string>>;
  verifyEmail: (payload: VerifyEmailRequest) => Promise<ApiResponse<string>>;
  logout: () => Promise<LogOutAtResponseDto>;
  loading: boolean;
  error: string;
};

export function useAuth(): UseAuthHook {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

const loginMutation = useMutation({
  mutationFn: (payload: LoginRequest) => authService.loginAsync(payload),

    onSuccess: (response) => {
      dispatch(setCredentials(response.data));

      if (response.data.showLicenseWarning) {
        localStorage.setItem("showLicenseModalAfterLogin", "1");
      } else {
        localStorage.removeItem("showLicenseModalAfterLogin");
      }

      toast.success(response.message);

      navigate("/chat", { replace: true });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authService.registerAsync(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      navigate("/check-email", { replace: true });
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authService.forgotPasswordAsync(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      navigate("/check-email", { replace: true });
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPasswordAsync(payload),
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyEmailRequest) =>
      authService.verifyEmailAsync(payload),
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logoutAsync(),
    onSuccess: (response) => {
      dispatch(clearAuth());
      queryClient.removeQueries({ queryKey: QUERY_KEYS.conversations });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.agents });
      toast.success(response.message);
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const login = useCallback(
    (payload: LoginRequest) => loginMutation.mutateAsync(payload),
    [loginMutation]
  );

  const registerAsync = useCallback(
    (payload: RegisterRequest) => registerMutation.mutateAsync(payload),
    [registerMutation]
  );

  const forgotPasswordAsync = useCallback(
    (payload: ForgotPasswordRequest) =>
      forgotPasswordMutation.mutateAsync(payload),
    [forgotPasswordMutation]
  );

  const resetPasswordAsync = useCallback(
    (payload: ResetPasswordRequest) => resetPasswordMutation.mutateAsync(payload),
    [resetPasswordMutation]
  );

  const verifyEmail = useCallback(
    (payload: VerifyEmailRequest) => verifyEmailMutation.mutateAsync(payload),
    [verifyEmailMutation]
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  );

  const loading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending ||
    verifyEmailMutation.isPending ||
    logoutMutation.isPending;

  const error = useMemo(() => {
    if (loginMutation.error) {
      return formatErrorMessage(loginMutation.error);
    }

    if (registerMutation.error) {
      return formatErrorMessage(registerMutation.error);
    }

    if (forgotPasswordMutation.error) {
      return formatErrorMessage(forgotPasswordMutation.error);
    }

    if (resetPasswordMutation.error) {
      return formatErrorMessage(resetPasswordMutation.error);
    }

    if (verifyEmailMutation.error) {
      return formatErrorMessage(verifyEmailMutation.error);
    }

    if (logoutMutation.error) {
      return formatErrorMessage(logoutMutation.error);
    }

    return "";
  }, [
    loginMutation.error,
    registerMutation.error,
    forgotPasswordMutation.error,
    resetPasswordMutation.error,
    verifyEmailMutation.error,
    logoutMutation.error,
  ]);

  return {
    login,
    registerAsync,
    forgotPasswordAsync,
    resetPasswordAsync,
    verifyEmail,
    logout,
    loading,
    error,
  };
}