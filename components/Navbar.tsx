import Link from 'next/link';
import { User } from '@/lib/types';
import { getProfileUrl } from '@/lib/utils';
import { ShoppingCart, User as UserIcon, LogOut, Settings } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Navbar({ user, onLogout, onOpenSellSheet }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-12">
            <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight">
              ScaperHub<span className="text-primary-500">.</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {user && (
                <button
                  onClick={onOpenSellSheet}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sell
                </button>
              )}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/messages"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Link>
                <Link
                  href={getProfileUrl(user.username, user.userType)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  {user.name}
                </Link>
                <button
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

