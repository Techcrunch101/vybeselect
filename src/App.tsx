import { RouterProvider, useRouter } from '@/context/RouterContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { LandingPage } from '@/pages/LandingPage';
import { ApplicationFormPage } from '@/pages/ApplicationFormPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { FullPageSpinner } from '@/components/Spinner';

function AppRoutes() {
  const { path } = useRouter();
  const { session, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Loading…" />;

  if (path === '/' || path === '') return <LandingPage />;
  if (path === '/apply') return <ApplicationFormPage />;
  if (path.startsWith('/apply/')) return <ApplicationFormPage />;
  if (path === '/admin/login') {
    if (session) {
      window.location.hash = '/admin';
      return <FullPageSpinner />;
    }
    return <AdminLoginPage />;
  }

  if (path.startsWith('/admin')) {
    if (!session) {
      window.location.hash = '/admin/login';
      return <FullPageSpinner />;
    }
    return (
      <AdminLayout>
        <DashboardPage />
      </AdminLayout>
    );
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider>
          <AppRoutes />
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
