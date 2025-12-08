import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Conversation, Message, User, Item } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/utils';
import { MessageCircle, Send } from 'lucide-react';
import Footer from '@/components/Footer';

interface MessagesProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Messages({ user, onLogout, onOpenSellSheet }: MessagesProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [item, setItem] = useState<Item | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadConversations();
  }, [user, router]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadItem(selectedConversation.itemId);
    }
  }, [selectedConversation]);

  const loadConversations = () => {
    const token = localStorage.getItem('token');
    fetch('/api/messages', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setConversations(data.conversations || []);
        setLoading(false);
      });
  };

  const loadMessages = (conversationId: string) => {
    const token = localStorage.getItem('token');
    fetch(`/api/messages?conversationId=${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        // Mark messages as read
        if (data.messages) {
          fetch('/api/messages', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ conversationId, markAsRead: true }),
          }).catch(() => {});
        }
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

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user) return;

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
        loadMessages(selectedConversation.id);
        loadConversations();
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <div className="flex-1 w-full">
        <div className="flex max-w-7xl mx-auto">
          {/* Left Sidebar - Conversations */}
          <aside className="w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-80px)]">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm">No conversations yet</p>
                    <Link
                      href="/"
                      className="text-sm text-gray-900 hover:underline mt-2 inline-block"
                    >
                      Browse items
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedConversation?.id === conv.id
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium truncate">
                          {conv.itemId ? `Item #${conv.itemId.slice(0, 8)}` : 'Conversation'}
                        </div>
                        {conv.lastMessage && (
                          <div className={`text-xs mt-1 truncate ${
                            selectedConversation?.id === conv.id ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {conv.lastMessage}
                          </div>
                        )}
                        {conv.lastMessageAt && (
                          <div className={`text-xs mt-1 ${
                            selectedConversation?.id === conv.id ? 'text-gray-400' : 'text-gray-400'
                          }`}>
                            {formatDate(conv.lastMessageAt)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Content Area - Messages */}
          <main className="flex-1 p-8">
            {selectedConversation ? (
              <div className="flex flex-col h-[calc(100vh-160px)]">
                {/* Item Header */}
                {item && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <Link
                      href={`/items/${item.id}`}
                      className="text-gray-900 hover:text-gray-700 font-semibold text-base"
                    >
                      {item.title}
                    </Link>
                    <div className="text-sm text-gray-500 mt-1">{formatPrice(item.price)}</div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderId === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-lg ${
                            msg.senderId === user.id
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1.5 ${
                              msg.senderId === user.id ? 'text-gray-300' : 'text-gray-500'
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-xl">
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

