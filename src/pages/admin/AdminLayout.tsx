import { type ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/context/RouterContext';
import { LogOut, Menu, X } from 'lucide-react';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 sticky top-0 h-screen p-4">
        <Link to="/admin" className="flex items-center mb-8">
          <span className="font-bold text-lg text-gray-900">VYBE SELECT</span>
        </Link>
        <div className="flex-1" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center">
          <span className="font-bold text-base text-gray-900">VYBE SELECT</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="text-gray-600 p-2">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 p-4 flex flex-col animate-slide-in-right">
            <button onClick={() => setMobileOpen(false)} className="self-end p-2 text-gray-400 mb-4">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 pt-14 lg:pt-0 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
