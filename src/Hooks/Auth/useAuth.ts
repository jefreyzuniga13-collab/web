import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import type { AppDispatch } from "@/Context";
import type {
  ApiResponse,
  AuthData,
  ForgotPasswordRequest,
  LoginRequest,
  LogOutAtResponseDto,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@/Interfaces/Auth/AuthInterface";

import {
  logout as clearAuth,
  setCredentials,
} from "@/Context/Slices/Auth/authSlice";
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice";

import { authService } from "@/Services/auth/AuthService";
import { formatErrorMessage } from "@/Utils/Https/formatErrorMessage";
import { runCartAutoCleanAfterLogin } from "@/Utils/ECommerce/runCartAutoCleanAfterLogin";

type UseAuthHook = {
  login(payload: LoginRequest): Promise<ApiResponse<AuthData>>;

  forceReplaceLogin(
    payload: LoginRequest,
  ): Promise<ApiResponse<AuthData>>;

  registerAsync(
    payload: RegisterRequest,
  ): Promise<ApiResponse<string>>;

  forgotPasswordAsync(
    payload: ForgotPasswordRequest,
  ): Promise<ApiResponse<string>>;

  resetPasswordAsync(
    payload: ResetPasswordRequest,
  ): Promise<ApiResponse<string>>;

  verifyEmail(
    payload: VerifyEmailRequest,
  ): Promise<ApiResponse<string>>;

  logout(): Promise<LogOutAtResponseDto>;

  loading: boolean;
  error: string;
};

/**
 * Operaciones centrales de autenticación.
 *
 * El conflicto ACTIVE_SESSION_EXISTS no se convierte en toast aquí.
 * Se propaga hasta useLoginForm para mostrar el modal local
 * de reemplazo de sesión.
 */
export function useAuth(): UseAuthHook {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) =>
      authService.loginAsync(payload),

    onSuccess: async (response) => {
      dispatch(setCredentials(response.data));

      await runCartAutoCleanAfterLogin();

      toast.success(response.message);

      navigate("/chat", {
        replace: true,
      });
    },
  });

  const forceReplaceLoginMutation = useMutation({
    mutationFn: (payload: LoginRequest) =>
      authService.forceReplaceLoginAsync(payload),

    onSuccess: async (response) => {
      dispatch(setCredentials(response.data));

      await runCartAutoCleanAfterLogin();

      toast.success(response.message);

      navigate("/chat", {
        replace: true,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) =>
      authService.registerAsync(payload),

    onSuccess: (response) => {
      toast.success(response.message);

      navigate("/check-email", {
        replace: true,
      });
    },

    onError: (currentError) => {
      toast.error(formatErrorMessage(currentError));
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authService.forgotPasswordAsync(payload),

    onSuccess: (response) => {
      toast.success(response.message);

      navigate("/check-email", {
        replace: true,
      });
    },

    onError: (currentError) => {
      toast.error(formatErrorMessage(currentError));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPasswordAsync(payload),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (currentError) => {
      toast.error(formatErrorMessage(currentError));
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyEmailRequest) =>
      authService.verifyEmailAsync(payload),

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: (currentError) => {
      toast.error(formatErrorMessage(currentError));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logoutAsync(),

    onSuccess: (response) => {
      dispatch(clearAuth());
      dispatch(clearCompanyState());

      /*
       * Elimina datos en caché asociados a la sesión anterior.
       */
      queryClient.clear();

      toast.success(response.message);

      navigate("/login", {
        replace: true,
      });
    },

    onError: (currentError) => {
      toast.error(formatErrorMessage(currentError));
    },
  });

  const loginAsync = loginMutation.mutateAsync;
  const forceReplaceLoginAsync =
    forceReplaceLoginMutation.mutateAsync;
  const registerMutationAsync = registerMutation.mutateAsync;
  const forgotPasswordMutationAsync =
    forgotPasswordMutation.mutateAsync;
  const resetPasswordMutationAsync =
    resetPasswordMutation.mutateAsync;
  const verifyEmailMutationAsync =
    verifyEmailMutation.mutateAsync;
  const logoutMutationAsync = logoutMutation.mutateAsync;

  const login = useCallback(
    (payload: LoginRequest) => loginAsync(payload),
    [loginAsync],
  );

  const forceReplaceLogin = useCallback(
    (payload: LoginRequest) =>
      forceReplaceLoginAsync(payload),
    [forceReplaceLoginAsync],
  );

  const registerAsync = useCallback(
    (payload: RegisterRequest) =>
      registerMutationAsync(payload),
    [registerMutationAsync],
  );

  const forgotPasswordAsync = useCallback(
    (payload: ForgotPasswordRequest) =>
      forgotPasswordMutationAsync(payload),
    [forgotPasswordMutationAsync],
  );

  const resetPasswordAsync = useCallback(
    (payload: ResetPasswordRequest) =>
      resetPasswordMutationAsync(payload),
    [resetPasswordMutationAsync],
  );

  const verifyEmail = useCallback(
    (payload: VerifyEmailRequest) =>
      verifyEmailMutationAsync(payload),
    [verifyEmailMutationAsync],
  );

  const logout = useCallback(
    () => logoutMutationAsync(),
    [logoutMutationAsync],
  );

  const loading =
    loginMutation.isPending ||
    forceReplaceLoginMutation.isPending ||
    registerMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending ||
    verifyEmailMutation.isPending ||
    logoutMutation.isPending;

  const error = useMemo(() => {
    const currentError =
      loginMutation.error ||
      forceReplaceLoginMutation.error ||
      registerMutation.error ||
      forgotPasswordMutation.error ||
      resetPasswordMutation.error ||
      verifyEmailMutation.error ||
      logoutMutation.error;

    return currentError
      ? formatErrorMessage(currentError)
      : "";
  }, [
    forgotPasswordMutation.error,
    forceReplaceLoginMutation.error,
    loginMutation.error,
    logoutMutation.error,
    registerMutation.error,
    resetPasswordMutation.error,
    verifyEmailMutation.error,
  ]);

  return {
    login,
    forceReplaceLogin,
    registerAsync,
    forgotPasswordAsync,
    resetPasswordAsync,
    verifyEmail,
    logout,
    loading,
    error,
  };
}