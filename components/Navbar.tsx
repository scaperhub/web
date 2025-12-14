import Link from 'next/link';
import { User } from '@/lib/types';
import { getProfileUrl } from '@/lib/utils';
import { MessageCircle, User as UserIcon, LogOut, Settings, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
  unreadCount?: number;
}

export default function Navbar({ user, onLogout, onOpenSellSheet, unreadCount = 0 }: NavbarProps) {
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
                  className="relative text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none font-semibold px-1.5 py-0.5 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
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
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-amber-50 border-t border-b border-amber-200">
        <div
          className="max-w-7xl mx-auto px-6 lg:px-8 py-2 text-xs sm:text-sm text-amber-900 text-center flex items-center justify-center gap-2"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 animate-pulse" aria-hidden="true" />
          <span className="font-semibold">Safety:</span>
          <span>Absolutely no sharing of personal info — transact ONLY with confirmed, genuine sellers.</span>
        </div>
      </div>
    </nav>
  );
}

