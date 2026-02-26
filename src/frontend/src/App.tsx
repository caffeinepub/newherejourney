import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import LandingPage from './pages/LandingPage';
import WelcomePage from './pages/guest/WelcomePage';
import JourneyDashboard from './pages/guest/JourneyDashboard';
import StepDetailPage from './pages/guest/StepDetailPage';
import DecisionHub from './pages/guest/DecisionHub';
import ProfilePage from './pages/guest/ProfilePage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import GuestsTablePage from './pages/admin/GuestsTablePage';
import JourneyBuilderPage from './pages/admin/JourneyBuilderPage';
import BrandingPage from './pages/admin/BrandingPage';
import TeamPage from './pages/admin/TeamPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import BillingPage from './pages/admin/BillingPage';
import SuperAdminChurchListPage from './pages/superadmin/ChurchListPage';
import SuperAdminTemplatePage from './pages/superadmin/TemplatePage';
import SuperAdminFeatureFlagsPage from './pages/superadmin/FeatureFlagsPage';
import SuperAdminSubscriptionPage from './pages/superadmin/SubscriptionManagementPage';
import SuperAdminGlobalAnalyticsPage from './pages/superadmin/GlobalAnalyticsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import AdminSignupPage from './pages/AdminSignupPage';
import AuthGuard from './components/AuthGuard';
import AdminLayout from './components/AdminLayout';
import SuperAdminLayout from './components/SuperAdminLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
});

// Public routes
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: LandingPage });
const welcomeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/guest/welcome', component: WelcomePage });
const journeyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/guest/journey', component: JourneyDashboard });
const stepRoute = createRoute({ getParentRoute: () => rootRoute, path: '/guest/step/$stepId', component: StepDetailPage });
const decisionRoute = createRoute({ getParentRoute: () => rootRoute, path: '/guest/decisions', component: DecisionHub });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/guest/profile', component: ProfilePage });
const paymentSuccessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payment-success', component: PaymentSuccessPage });
const paymentFailureRoute = createRoute({ getParentRoute: () => rootRoute, path: '/payment-failure', component: PaymentFailurePage });
const adminSignupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin/signup', component: AdminSignupPage });

// Admin routes (wrapped in AuthGuard + AdminLayout)
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AuthGuard requireAdmin>
      <AdminLayout />
    </AuthGuard>
  ),
});
const adminDashRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/dashboard', component: AdminDashboardPage });
const adminGuestsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/guests', component: GuestsTablePage });
const adminJourneyRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/journey-builder', component: JourneyBuilderPage });
const adminBrandingRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/branding', component: BrandingPage });
const adminTeamRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/team', component: TeamPage });
const adminAnalyticsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/analytics', component: AnalyticsPage });
const adminBillingRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/billing', component: BillingPage });

// SuperAdmin routes
const superAdminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/superadmin',
  component: () => (
    <AuthGuard requireSuperAdmin>
      <SuperAdminLayout />
    </AuthGuard>
  ),
});
const superAdminChurchesRoute = createRoute({ getParentRoute: () => superAdminLayoutRoute, path: '/churches', component: SuperAdminChurchListPage });
const superAdminTemplatesRoute = createRoute({ getParentRoute: () => superAdminLayoutRoute, path: '/templates', component: SuperAdminTemplatePage });
const superAdminFlagsRoute = createRoute({ getParentRoute: () => superAdminLayoutRoute, path: '/feature-flags', component: SuperAdminFeatureFlagsPage });
const superAdminSubsRoute = createRoute({ getParentRoute: () => superAdminLayoutRoute, path: '/subscriptions', component: SuperAdminSubscriptionPage });
const superAdminAnalyticsRoute = createRoute({ getParentRoute: () => superAdminLayoutRoute, path: '/analytics', component: SuperAdminGlobalAnalyticsPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  welcomeRoute,
  journeyRoute,
  stepRoute,
  decisionRoute,
  profileRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  adminSignupRoute,
  adminLayoutRoute.addChildren([
    adminDashRoute,
    adminGuestsRoute,
    adminJourneyRoute,
    adminBrandingRoute,
    adminTeamRoute,
    adminAnalyticsRoute,
    adminBillingRoute,
  ]),
  superAdminLayoutRoute.addChildren([
    superAdminChurchesRoute,
    superAdminTemplatesRoute,
    superAdminFlagsRoute,
    superAdminSubsRoute,
    superAdminAnalyticsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
