import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User } from '@/lib/types';
import SellSheet from '@/components/SellSheet';
import EditProfileSheet from '@/components/EditProfileSheet';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSellSheet, setShowSellSheet] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const openSellSheet = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowSellSheet(true);
  };

  const openEditProfileSheet = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setShowEditProfileSheet(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Component 
        {...pageProps} 
        user={user} 
        onLogin={login} 
        onLogout={logout}
        onOpenSellSheet={openSellSheet}
        onOpenEditProfileSheet={openEditProfileSheet}
      />
      <SellSheet
        user={user}
        isOpen={showSellSheet}
        onClose={() => setShowSellSheet(false)}
        onSuccess={(itemId) => {
          router.push(`/items/${itemId}`);
        }}
      />
      <EditProfileSheet
        user={user}
        isOpen={showEditProfileSheet}
        onClose={() => setShowEditProfileSheet(false)}
        onSuccess={(updatedUser) => {
          login(updatedUser, localStorage.getItem('token') || '');
        }}
      />
    </>
  );
}

// EditItemSheet added Sun Dec  7 15:39:01 IST 2025
// Final fix Sun Dec  7 16:03:01 IST 2025
