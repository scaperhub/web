import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import { Conversation, Message, User, Item } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { MessageCircle, Send } from 'lucide-react';
import Footer from '@/components/Footer';

interface MessagesProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
  unreadCount?: number;
  refreshUnread?: () => void;
}

export default function Messages({ user, onLogout, onOpenSellSheet, refreshUnread }: MessagesProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'selling' | 'buying'>('selling');
  const [markingSold, setMarkingSold] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollConversationsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollMessagesRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadConversations();

    // Preload items for sidebar display
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        const map: Record<string, Item> = {};
        (data.items || []).forEach((it: Item) => {
          map[it.id] = it;
        });
        setItemsById(map);
      })
      .catch(() => {});

    // Fallback polling for conversations (every 5s) in case websocket is unavailable
    pollConversationsRef.current = setInterval(() => {
      loadConversations(true);
    }, 5000);

    return () => {
      if (pollConversationsRef.current) {
        clearInterval(pollConversationsRef.current);
        pollConversationsRef.current = null;
      }
    };
  }, [user, router]);

  useEffect(() => {
    if (!selectedConversation) return;
    selectedConversationIdRef.current = selectedConversation.id;
    setOtherTyping(false);
    if (otherTypingTimeoutRef.current) {
      clearTimeout(otherTypingTimeoutRef.current);
      otherTypingTimeoutRef.current = null;
    }
    myTypingRef.current = false;
    loadMessages(selectedConversation.id);
    loadItem(selectedConversation.itemId);
    loadOtherUser(selectedConversation);

    // Fallback polling for active conversation (every 2s)
    if (pollMessagesRef.current) {
      clearInterval(pollMessagesRef.current);
      pollMessagesRef.current = null;
    }
    pollMessagesRef.current = setInterval(() => {
      loadMessages(selectedConversation.id, true);
    }, 2000);

    return () => {
      if (pollMessagesRef.current) {
        clearInterval(pollMessagesRef.current);
        pollMessagesRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  // Load user profiles for conversations to display names/avatars
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    const ids = Array.from(
      new Set(
        conversations.flatMap(c => [c.buyerId, c.sellerId]).filter(Boolean)
      )
    );
    if (ids.length === 0) return;
    fetch('/api/users/by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: ids }),
    })
      .then(res => res.json())
      .then(data => {
        const map: Record<string, User> = {};
        (data.users || []).forEach((u: User) => {
          map[u.id] = u as User;
        });
        setUsersById(map);
      })
      .catch(() => {});
  }, [conversations]);

  // Keep filter and selections in sync with available conversations
  useEffect(() => {
    if (!user) return;
    const selling = conversations.filter(c => c.sellerId === user.id);
    const buying = conversations.filter(c => c.buyerId === user.id);

    if (filterMode === 'selling' && selling.length === 0 && buying.length > 0) {
      setFilterMode('buying');
      return;
    }
    if (filterMode === 'buying' && buying.length === 0 && selling.length > 0) {
      setFilterMode('selling');
      return;
    }

    const currentList = filterMode === 'selling' ? selling : buying;
    const currentIds = new Set(currentList.map(c => c.id));

    if (selectedConversation && !currentIds.has(selectedConversation.id)) {
      const next = currentList[0] || null;
      setSelectedConversation(next);
      setSelectedItemId(filterMode === 'selling' ? next?.itemId ?? null : null);
      return;
    }

    if (!selectedConversation && currentList.length > 0) {
      setSelectedConversation(currentList[0]);
      setSelectedItemId(filterMode === 'selling' ? currentList[0].itemId : null);
      return;
    }

    if (filterMode === 'selling' && selectedConversation) {
      if (selectedItemId !== selectedConversation.itemId) {
        setSelectedItemId(selectedConversation.itemId);
      }
    } else if (filterMode === 'buying' && selectedItemId) {
      setSelectedItemId(null);
    }
  }, [conversations, filterMode, selectedConversation, user, selectedItemId]);

  // Live WebSocket connection
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const setup = async () => {
      // Ensure the server-side WebSocket handler is initialized
      await fetch('/api/ws').catch(() => {});

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Kick off presence heartbeat
        presenceIntervalRef.current = setInterval(() => {
          ws.send(JSON.stringify({ type: 'presence:ping' }));
        }, 20000);
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message:new') {
            loadConversations(true);
            if (selectedConversationIdRef.current === data.conversationId) {
              loadMessages(data.conversationId, true);
              // Mark as read refresh will run inside loadMessages
            } else {
              if (refreshUnread) refreshUnread();
            }
            return;
          }

          if (data.type === 'typing') {
            if (
              selectedConversationIdRef.current === data.conversationId &&
              data.userId !== user.id
            ) {
              setOtherTyping(true);
              if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
              otherTypingTimeoutRef.current = setTimeout(() => {
                setOtherTyping(false);
              }, 2500);
            }
            return;
          }

          if (data.type === 'message:read') {
            if (selectedConversationIdRef.current === data.conversationId) {
              loadMessages(data.conversationId, true);
            }
            return;
          }

          if (data.type === 'presence') {
            if (otherUser && data.userId === otherUser.id) {
              setOtherUser(prev => (prev ? { ...prev, lastSeen: data.lastSeen } : prev));
            }
            return;
          }
        } catch {
          // ignore malformed payloads
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current);
          presenceIntervalRef.current = null;
        }
      };

      ws.onerror = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current);
          presenceIntervalRef.current = null;
        }
      };
    };

    setup();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      if (pollConversationsRef.current) {
        clearInterval(pollConversationsRef.current);
        pollConversationsRef.current = null;
      }
      if (pollMessagesRef.current) {
        clearInterval(pollMessagesRef.current);
        pollMessagesRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-scroll to latest message when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = (silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!silent) setLoading(true);

    fetch('/api/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);
        if (!silent) setLoading(false);
      })
      .catch(() => {
        if (!silent) setLoading(false);
      });
  };

  const loadMessages = (conversationId: string, silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/messages?conversationId=${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const msgs = data.messages || [];
        setMessages(msgs);
        const isSeller = selectedConversation?.sellerId === user?.id;
        const sellerId = selectedConversation?.sellerId;
        const hasSellerMessage = sellerId ? msgs.some((m: Message) => m.senderId === sellerId) : false;
        setCanChat(isSeller || hasSellerMessage);
        // Mark messages as read
        if (data.messages && !silent) {
          fetch('/api/messages', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversationId, markAsRead: true }),
          })
            .then(() => {
              if (refreshUnread) refreshUnread();
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // If it fails, keep current view; background refresh will try again
      });
  };

  const loadItem = (itemId: string) => {
    fetch(`/api/items/${itemId}`)
      .then(res => res.json())
      .then(data => {
        if (data.item) {
          setItem(data.item);
          // In a real app, you'd fetch the other user's details
          // For now, we'll just use a placeholder
        }
      });
  };

  const loadOtherUser = (conversation: Conversation) => {
    const otherUserId = conversation.buyerId === user?.id ? conversation.sellerId : conversation.buyerId;
    if (!otherUserId) return;

    fetch('/api/users/by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [otherUserId] }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.users && data.users[0]) {
          setOtherUser(data.users[0]);
        }
      })
      .catch(() => {});
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user) return;
    const inputEl = document.getElementById('chat-input') as HTMLInputElement | null;
    const isSeller = selectedConversation.sellerId === user.id;
    if (!isSeller && !canChat) return;

    setSending(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: selectedConversation.itemId,
          receiverId: user.id === selectedConversation.buyerId
            ? selectedConversation.sellerId
            : selectedConversation.buyerId,
          content: newMessage,
          conversationId: selectedConversation.id,
        }),
      });

      if (res.ok) {
        setNewMessage('');
        sendTyping(false);
        loadMessages(selectedConversation.id);
        loadConversations();
        if (inputEl) {
          inputEl.focus();
        }
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsSold = async () => {
    if (!item || !user) return;
    if (item.sellerId !== user.id) return;
    setMarkingSold(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'sold' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.item) {
        setItem(data.item);
        setItemsById(prev => ({ ...prev, [data.item.id]: data.item }));
      }
    } catch (err) {
      alert('Could not mark as sold. Please try again.');
    } finally {
      setMarkingSold(false);
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!selectedConversationIdRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        conversationId: selectedConversationIdRef.current,
        isTyping,
      })
    );
  };

  const handleTypingChange = (value: string) => {
    setNewMessage(value);
    if (!selectedConversationIdRef.current) return;

    if (!myTypingRef.current) {
      sendTyping(true);
      myTypingRef.current = true;
    } else {
      sendTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
      myTypingRef.current = false;
    }, 2000);
  };

  const focusMessageInput = () => {
    const input = document.getElementById('chat-input') as HTMLInputElement | null;
    if (input) input.focus();
  };

  useEffect(() => {
    if (!selectedConversation) return;
    focusMessageInput();
  }, [selectedConversation, messages.length, canChat]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white w-full">
        <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
        <div className="flex-1 w-full">
          <div className="flex items-center justify-center h-full max-w-7xl mx-auto">
            <div className="text-sm text-gray-400">Loading conversations...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sellingConversations = conversations.filter(c => user && c.sellerId === user.id);
  const buyingConversations = conversations.filter(c => user && c.buyerId === user.id);

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <div className="flex-1 w-full flex overflow-hidden">
        <div
          className="flex max-w-7xl mx-auto flex-1 w-full min-h-0 overflow-hidden"
          style={{ height: 'calc(100vh - 120px)' }}
        >
          {/* Left Sidebar */}
          <aside className="w-72 border-r border-gray-200 bg-white h-full overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setFilterMode('selling')}
                  disabled={sellingConversations.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filterMode === 'selling'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  } ${sellingConversations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Selling ({sellingConversations.length})
                </button>
                <button
                  onClick={() => setFilterMode('buying')}
                  disabled={buyingConversations.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    filterMode === 'buying'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  } ${buyingConversations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Buying ({buyingConversations.length})
                </button>
              </div>
            </div>

            {filterMode === 'selling' ? (
              <div className="divide-y divide-gray-100">
                {(() => {
                  const grouped = sellingConversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
                    if (!acc[conv.itemId]) acc[conv.itemId] = [];
                    acc[conv.itemId].push(conv);
                    return acc;
                  }, {});
                  const itemIds = Object.keys(grouped);

                  if (itemIds.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500 px-4">
                        <p className="text-sm">No conversations yet</p>
                        <Link href="/" className="text-sm text-gray-900 hover:underline mt-2 inline-block">
                          Browse items
                        </Link>
                      </div>
                    );
                  }

                  return itemIds.map(itemId => {
                    const item = itemsById[itemId];
                    const convs = grouped[itemId] || [];
                    return (
                      <div key={itemId} className={`${selectedItemId === itemId ? 'bg-gray-50' : ''}`}>
                        <button
                          onClick={() => {
                            setSelectedItemId(itemId);
                            setSelectedConversation(convs[0]);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {item?.images?.[0] ? (
                              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                {item?.title?.[0]?.toUpperCase() || '•'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">{item?.title || 'Listing'}</div>
                            <div className="text-xs text-gray-500">
                              {convs.length} {convs.length === 1 ? 'enquiry' : 'enquiries'}
                            </div>
                          </div>
                        </button>

                        {selectedItemId === itemId && (
                          <div className="px-4 pb-3 space-y-1">
                            {convs.map(conv => {
                              const buyer = usersById[conv.buyerId];
                              return (
                                <button
                                  key={conv.id}
                                  onClick={() => setSelectedConversation(conv)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedConversation?.id === conv.id
                                      ? 'bg-primary-600 text-white'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                      {buyer?.avatar ? (
                                        <img src={buyer.avatar} alt={buyer.name || buyer.username} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                          {(buyer?.name || buyer?.username || 'U')[0]?.toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">
                                        {buyer?.name || buyer?.username || 'Unknown user'}
                                      </div>
                                      {conv.lastMessage && (
                                        <div
                                          className={`text-xs mt-1 truncate ${
                                            selectedConversation?.id === conv.id ? 'text-gray-300' : 'text-gray-500'
                                          }`}
                                        >
                                          {conv.lastMessage}
                                        </div>
                                      )}
                                      {conv.lastMessageAt && (
                                        <div
                                          className={`text-xs mt-1 ${
                                            selectedConversation?.id === conv.id ? 'text-gray-400' : 'text-gray-400'
                                          }`}
                                        >
                                          {formatDate(conv.lastMessageAt)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {buyingConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm">No conversations yet</p>
                    <Link href="/" className="text-sm text-gray-900 hover:underline mt-2 inline-block">
                      Browse items
                    </Link>
                  </div>
                ) : (
                  buyingConversations.map(conv => {
                    const convItem = itemsById[conv.itemId];
                    const seller = usersById[conv.sellerId];
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedItemId(null);
                          setSelectedConversation(conv);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-primary-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                            {convItem?.images?.[0] ? (
                              <img src={convItem.images[0]} alt={convItem.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                {convItem?.title?.[0]?.toUpperCase() || '•'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{convItem?.title || 'Listing'}</div>
                            {conv.lastMessage && (
                              <div
                                className={`text-xs mt-1 truncate ${
                                  selectedConversation?.id === conv.id ? 'text-gray-300' : 'text-gray-500'
                                }`}
                              >
                                {conv.lastMessage}
                              </div>
                            )}
                            {conv.lastMessageAt && (
                              <div
                                className={`text-xs mt-1 ${
                                  selectedConversation?.id === conv.id ? 'text-gray-400' : 'text-gray-400'
                                }`}
                              >
                                {formatDate(conv.lastMessageAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </aside>

          {/* Right Content Area - Messages */}
          <main className="flex-1 p-8 flex flex-col min-h-0 overflow-hidden">
            {selectedConversation ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Item Header */}
                {item && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            {item.title[0]?.toUpperCase() || '•'}
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/items/${item.id}`}
                          className="text-gray-900 hover:text-gray-700 font-semibold text-base"
                        >
                          {item.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">{formatPrice(item.price)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      {user?.id === item?.sellerId && item?.status === 'available' && (
                        <button
                          onClick={markAsSold}
                          disabled={markingSold}
                          className="ml-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {markingSold ? 'Marking...' : 'Mark as sold'}
                        </button>
                      )}
                      {user?.id === item?.sellerId && item?.status === 'sold' && (
                        <button
                          onClick={async () => {
                            if (!item || !user) return;
                            setMarkingSold(true);
                            const token = localStorage.getItem('token');
                            try {
                              const res = await fetch(`/api/items/${item.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ status: 'available' }),
                              });
                              if (!res.ok) throw new Error('Failed');
                              const data = await res.json();
                              if (data.item) {
                                setItem(data.item);
                                setItemsById(prev => ({ ...prev, [data.item.id]: data.item }));
                              }
                            } catch (err) {
                              alert('Could not undo sold. Please try again.');
                            } finally {
                              setMarkingSold(false);
                            }
                          }}
                          disabled={markingSold}
                          className="ml-4 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                          {markingSold ? 'Updating...' : 'Mark as available'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div
                  ref={messagesRef}
                  className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4"
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center space-y-3">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        {user?.id === selectedConversation?.sellerId ? (
                          <>
                            <p className="text-base font-medium text-gray-700">Buyer showed interest.</p>
                            <p className="text-sm text-gray-500">Click &quot;Let&apos;s talk&quot; to start the chat.</p>
                          </>
                        ) : (
                          <p className="text-base text-gray-500">Waiting for seller to start the chat.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isMine = msg.senderId === user.id;
                        const senderUser =
                          msg.senderId === user.id
                            ? user
                            : usersById[msg.senderId] || otherUser || null;
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        // WhatsApp-style: show avatar only on the first message of a sender block
                        const showAvatarLeft = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                        const showAvatarRight = isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                        const isLastMine =
                          isMine &&
                          messages.filter(m => m.senderId === user.id).slice(-1)[0]?.id === msg.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isMine && (
                              showAvatarLeft ? (
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                  {senderUser && senderUser.avatar ? (
                                    <img
                                      src={senderUser.avatar}
                                      alt={senderUser.name || senderUser.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      {(senderUser?.name || senderUser?.username || 'U')[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-8 h-8 flex-shrink-0" />
                              )
                            )}
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-lg ${
                                isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={`text-xs mt-1.5 ${
                                  isMine ? 'text-gray-300' : 'text-gray-500'
                                }`}
                              >
                                {formatDate(msg.createdAt)}
                              </p>
                              {isLastMine && (
                                <p className="text-[11px] mt-1 text-gray-300">
                                  {msg.read ? 'Seen' : 'Delivered'}
                                </p>
                              )}
                            </div>
                            {isMine && (
                              showAvatarRight ? (
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                  {senderUser && senderUser.avatar ? (
                                    <img
                                      src={senderUser.avatar}
                                      alt={senderUser.name || senderUser.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      {(senderUser?.name || senderUser?.username || 'U')[0]?.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-8 h-8 flex-shrink-0" />
                              )
                            )}
                          </div>
                        );
                      })}
                      {otherTyping && (
                        <div className="text-sm text-gray-500">Typing...</div>
                      )}
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex-shrink-0">
                  {user?.id === selectedConversation?.sellerId && messages.length === 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">Start chatting with this buyer?</p>
                      <button
                        onClick={() => {
                          setNewMessage("Let's talk about this item.");
                          handleSendMessage();
                        }}
                        disabled={sending}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Let&apos;s talk
                      </button>
                    </div>
                  )}
                  {(messages.length > 0 || (user && selectedConversation && (selectedConversation.sellerId === user.id || canChat))) && (
                    <div className="flex gap-3 mt-2">
                      <input
                        type="text"
                        id="chat-input"
                        value={newMessage}
                        onChange={e => handleTypingChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        onBlur={() => sendTyping(false)}
                        placeholder={canChat ? "Type a message..." : "Waiting for seller to start the chat"}
                        disabled={!canChat}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <button
                        type="button"
                        disabled={sending || !newMessage.trim() || !canChat}
                        onClick={handleSendMessage}
                        className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 min-h-[300px] bg-white border border-gray-200 rounded-xl">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-base">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Force server-side rendering to avoid static pre-render errors at build time
export async function getServerSideProps() {
  return { props: {} };
}

