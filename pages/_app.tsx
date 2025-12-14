import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { User, Item } from '@/lib/types';
import SellSheet from '@/components/SellSheet';
import EditProfileSheet from '@/components/EditProfileSheet';
import EditItemSheet from '@/components/EditItemSheet';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSellSheet, setShowSellSheet] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);
  const [showEditItemSheet, setShowEditItemSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const unreadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Token invalid or user no longer authorized (e.g., suspended)
          localStorage.removeItem('token');
          setUser(null);
          return;
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();

    if (unreadIntervalRef.current) {
      clearInterval(unreadIntervalRef.current);
    }
    unreadIntervalRef.current = setInterval(fetchUnread, 15000);

    return () => {
      if (unreadIntervalRef.current) {
        clearInterval(unreadIntervalRef.current);
        unreadIntervalRef.current = null;
      }
    };
  }, [user]);

  const refreshUnread = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUnreadCount(0);
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

  const openEditItemSheet = (item: Item) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setEditingItem(item);
    setShowEditItemSheet(true);
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
        unreadCount={unreadCount}
        refreshUnread={refreshUnread}
        onOpenSellSheet={openSellSheet}
        onOpenEditProfileSheet={openEditProfileSheet}
        onOpenEditItemSheet={openEditItemSheet}
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
      <EditItemSheet
        user={user}
        item={editingItem}
        isOpen={showEditItemSheet}
        onClose={() => {
          setShowEditItemSheet(false);
          setEditingItem(null);
        }}
        onSuccess={(itemId) => {
          router.push(`/items/${itemId}`);
        }}
      />
    </>
  );
}
