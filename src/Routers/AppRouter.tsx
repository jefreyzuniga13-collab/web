import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/Layout/MainLayout";
import { RequireAuth } from "@/Layout/RequireAuth";
import PublicRoute from "@/Layout/PublicRoute";
import ClientPage from "@/Pages/Crm/ClientPage";
import UserSessionPage from "@/Pages/Auth/UserSessionPage";
import ProtectedCartRoute from "@/Pages/ECommerce/ProtectedCartRoute";
import CheckoutPage from "@/Pages/ECommerce/CheckoutPage";
import SuccessRequest from "@/Pages/ECommerce/SuccessRequest";
import PaymentResultPage from "@/Pages/ECommerce/PaymentResultPage";
import PaymentHostedPage from "@/Pages/ECommerce/PaymentHostedPage";
import CustomLoader from "@/Components/Common/CustomLoader";
const Register = lazy(() => import("@/Pages/Auth/RegisterAccountPage"));
const Login = lazy(() => import("@/Pages/Auth/LoginPage"));
const VerifyEmail = lazy(() => import("@/Pages/Auth/VerifyEmailPage"));
const ForgotPassword = lazy(() => import("@/Pages/Auth/ForgotPasswordPage"));
const ResetPassword = lazy(() => import("@/Pages/Auth/ResetPasswordPage"));
const Activation = lazy(() => import("@/Pages/Auth/ActivationAccountPage"));
const Unauthorized = lazy(() => import("@/Components/Common/Unauthorized"));
const SupportPage = lazy(() => import("@/Pages/Chat/SupportPage"));
const UsersPage = lazy(() => import("@/Pages/Auth/UsersPage"));
const DashboardPage = lazy(() => import("@/Pages/Dashboard/DashboardPage"));
const NotificationsPage = lazy(() => import("@/Pages/Crm/NotificationsPage"));
const NotFound = lazy(() => import("@/Pages/Auth/NotFound"));
const SystemParameterPage = lazy(() => import("@/Pages/Crm/SystemParameterPage"),);
const CompanySystemParamsPage = lazy(() => import("@/Pages/Crm/CompanySystemParamsPage"),);
const ProfilePage = lazy(() => import("@/Pages/Auth/ProfilePage"));
const PrivacyPolicy = lazy(() => import("@/Pages/Auth/PrivacyPolicyPage"));
const VerifyNewContactPage = lazy(() => import("@/Pages/Auth/VerifyNewContactPage"),);
const OpeningHourPage = lazy(() => import("@/Pages/Crm/OpeningHourPage"));
const WorkShiftPage = lazy(() => import("@/Pages/Crm/WorkShiftPage"));
const ContactPage = lazy(() => import("@/Pages/Auth/ContactPage"));
const ConversationsPage = lazy(() => import("@/Pages/Chat/ConversationsPage"));
const TemplateCategoryPage = lazy(() => import("@/Pages/Chat/TemplateCategoryPage"),);
const WaTemplatesPage = lazy(() => import("@/Pages/Wa/WaTemplatePage"));
const ProductCatalogPage = lazy(() => import("@/Pages/Wa/ProductCatalogPage"));
const DynamicParamPage = lazy(() => import("@/Pages/Crm/DynamicParamPage"));
const ClientManagementPanel = lazy(() => import("@/Pages/Crm/ClientManagementPanel"),);
const LicensePage = lazy(() => import("@/Pages/Crm/LicensePage"),);
const CompaniesLicensePage = lazy(() => import("@/Pages/Crm/CompaniesLicensePage"));
export function AppRouter() {
  return (
    <Suspense fallback={<CustomLoader />}>
      <Routes>
        <Route path="cart" element={<ProtectedCartRoute />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment-result" element={<PaymentResultPage />} />
        <Route path="successOrder" element={<SuccessRequest />} />
        <Route path="payment-hosted" element={<PaymentHostedPage />} />
        <Route element={<PublicRoute />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Register />} />
          <Route path="check-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-account" element={<Activation />} />
        </Route>
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat" element={<SupportPage />} />
          <Route path="UserSessions" element={<UserSessionPage />} />
          <Route path="contacts" element={<ContactPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="system-params" element={<SystemParameterPage />} />
          <Route path="companysystem-params" element={<CompanySystemParamsPage />} />
          <Route path="license" element={<LicensePage />} />
          <Route path="companieslicense" element={<CompaniesLicensePage />} />
          <Route
            path="templates-categories"
            element={<TemplateCategoryPage />}
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="opening-hour" element={<OpeningHourPage />} />
          <Route path="work-shift" element={<WorkShiftPage />} />
          <Route path="verify-contact/:id" element={<VerifyNewContactPage />} />
          <Route
            path="conversation/status/:state"
            element={<ConversationsPage />}
          />
          <Route
            path="conversation/rating/:rating/:selectedAgentId"
            element={<ConversationsPage />}
          />
          <Route
            path="whatsapp-productcatalogs"
            element={<ProductCatalogPage />}
          />
          <Route path="templates-management" element={<WaTemplatesPage />} />
          <Route path="clients" element={<ClientPage />} />
          <Route
            path="clientManagementPanel/:id"
            element={<ClientManagementPanel />}
          />
          <Route path="live-dashboard" element={<DynamicParamPage />} />
          <Route
            path="settings"
            element={<Navigate to="system-params" replace />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}