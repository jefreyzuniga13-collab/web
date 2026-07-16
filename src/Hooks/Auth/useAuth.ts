import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { AppDispatch } from "@/Context";
import { setCredentials, logout as clearAuth} from "@/Context/Slices/Auth/authSlice";
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice";
import { clearLoginAccessState } from "@/Context/Slices/Auth/loginAccessSlice";
import { QUERY_KEYS } from "@/Constants/queryKeys";
import type { ApiResponse, AuthData,  ForgotPasswordRequest,  LoginAccessRequestResponseDto, LoginRequest, LogOutAtResponseDto,  
  RegisterRequest, ResetPasswordRequest, VerifyEmailRequest,} from "@/Interfaces/Auth/AuthInterface";
import { authService } from "@/Services/auth/AuthService";
import { formatErrorMessage } from "@/Utils/Https/formatErrorMessage";

type UseAuthHook = {
  login(payload: LoginRequest): Promise<ApiResponse<AuthData>>;

  completeApprovedLogin(
    requestKey: string,
    payload: LoginRequest,
  ): Promise<ApiResponse<AuthData>>;

  approveLoginRequest(
    requestKey: string,
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>>;

  rejectLoginRequest(
    requestKey: string,
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>>;

  cancelLoginRequest(
    requestKey: string,
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>>;

  registerAsync(payload: RegisterRequest): Promise<ApiResponse<string>>;

  forgotPasswordAsync(
    payload: ForgotPasswordRequest,
  ): Promise<ApiResponse<string>>;

  resetPasswordAsync(
    payload: ResetPasswordRequest,
  ): Promise<ApiResponse<string>>;

  verifyEmail(payload: VerifyEmailRequest): Promise<ApiResponse<string>>;

  logout(): Promise<LogOutAtResponseDto>;

  loading: boolean;
  error: string;
};

export function useAuth(): UseAuthHook {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  /**
   * Inicio de sesión normal.
   *
   * El conflicto ACTIVE_SESSION_EXISTS se deja subir
   * hasta useLoginForm para activar la pantalla de espera.
   */
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authService.loginAsync(payload),

    onSuccess: (response) => {
      dispatch(setCredentials(response.data));

      dispatch(clearLoginAccessState());

      toast.success(response.message);

      navigate("/chat", {
        replace: true,
      });
    },
  });

  /**
   * Completa el login después de una aprobación.
   */
  const completeApprovedLoginMutation = useMutation({
    mutationFn: ({
      requestKey,
      payload,
    }: {
      requestKey: string;
      payload: LoginRequest;
    }) => authService.completeApprovedLoginAsync(requestKey, payload),

    onSuccess: (response) => {
      dispatch(setCredentials(response.data));

      dispatch(clearLoginAccessState());

      toast.success(response.message);

      navigate("/chat", {
        replace: true,
      });
    },
  });

  const approveLoginRequestMutation = useMutation({
    mutationFn: (requestKey: string) =>
      authService.approveLoginAccessRequestAsync(requestKey),
  });

  const rejectLoginRequestMutation = useMutation({
    mutationFn: (requestKey: string) =>
      authService.rejectLoginAccessRequestAsync(requestKey),
  });

  const cancelLoginRequestMutation = useMutation({
    mutationFn: (requestKey: string) =>
      authService.cancelLoginAccessRequestAsync(requestKey),
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

    onError: (error) => {
      toast.error(formatErrorMessage(error));
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

      dispatch(clearCompanyState());

      dispatch(clearLoginAccessState());

      queryClient.removeQueries({
        queryKey: QUERY_KEYS.conversations,
      });

      queryClient.removeQueries({
        queryKey: QUERY_KEYS.agents,
      });

      toast.success(response.message);

      navigate("/login", {
        replace: true,
      });
    },

    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const login = useCallback(
    (payload: LoginRequest) => loginMutation.mutateAsync(payload),
    [loginMutation],
  );

  const completeApprovedLogin = useCallback(
    (requestKey: string, payload: LoginRequest) =>
      completeApprovedLoginMutation.mutateAsync({
        requestKey,
        payload,
      }),
    [completeApprovedLoginMutation],
  );

  const approveLoginRequest = useCallback(
    (requestKey: string) => approveLoginRequestMutation.mutateAsync(requestKey),
    [approveLoginRequestMutation],
  );

  const rejectLoginRequest = useCallback(
    (requestKey: string) => rejectLoginRequestMutation.mutateAsync(requestKey),
    [rejectLoginRequestMutation],
  );

  const cancelLoginRequest = useCallback(
    (requestKey: string) => cancelLoginRequestMutation.mutateAsync(requestKey),
    [cancelLoginRequestMutation],
  );

  const registerAsync = useCallback(
    (payload: RegisterRequest) => registerMutation.mutateAsync(payload),
    [registerMutation],
  );

  const forgotPasswordAsync = useCallback(
    (payload: ForgotPasswordRequest) =>
      forgotPasswordMutation.mutateAsync(payload),
    [forgotPasswordMutation],
  );

  const resetPasswordAsync = useCallback(
    (payload: ResetPasswordRequest) =>
      resetPasswordMutation.mutateAsync(payload),
    [resetPasswordMutation],
  );

  const verifyEmail = useCallback(
    (payload: VerifyEmailRequest) => verifyEmailMutation.mutateAsync(payload),
    [verifyEmailMutation],
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation],
  );

  const loading =
    loginMutation.isPending ||
    completeApprovedLoginMutation.isPending ||
    approveLoginRequestMutation.isPending ||
    rejectLoginRequestMutation.isPending ||
    cancelLoginRequestMutation.isPending ||
    registerMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending ||
    verifyEmailMutation.isPending ||
    logoutMutation.isPending;

  const error = useMemo(() => {
    const currentError =
      loginMutation.error ||
      completeApprovedLoginMutation.error ||
      approveLoginRequestMutation.error ||
      rejectLoginRequestMutation.error ||
      cancelLoginRequestMutation.error ||
      registerMutation.error ||
      forgotPasswordMutation.error ||
      resetPasswordMutation.error ||
      verifyEmailMutation.error ||
      logoutMutation.error;

    return currentError ? formatErrorMessage(currentError) : "";
  }, [
    loginMutation.error,
    completeApprovedLoginMutation.error,
    approveLoginRequestMutation.error,
    rejectLoginRequestMutation.error,
    cancelLoginRequestMutation.error,
    registerMutation.error,
    forgotPasswordMutation.error,
    resetPasswordMutation.error,
    verifyEmailMutation.error,
    logoutMutation.error,
  ]);

  return {
    login,
    completeApprovedLogin,
    approveLoginRequest,
    rejectLoginRequest,
    cancelLoginRequest,
    registerAsync,
    forgotPasswordAsync,
    resetPasswordAsync,
    verifyEmail,
    logout,
    loading,
    error,
  };
}
