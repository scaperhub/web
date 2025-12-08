import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Item, User, Category } from '@/lib/types';
import { formatPrice, formatDate, getProfileUrl } from '@/lib/utils';
import { MapPin, User as UserIcon, MessageCircle, Calendar, Package, CheckCircle, X, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import Footer from '@/components/Footer';

interface ItemDetailProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
  onOpenEditItemSheet?: (item: Item) => void;
}

export default function ItemDetail({ user, onLogout, onOpenSellSheet, onOpenEditItemSheet }: ItemDetailProps) {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState<Item | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/items/${id}`)
      .then(res => res.json())
      .then(async data => {
        if (data.item) {
          setItem(data.item);
          const [catRes, usersRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/users/by-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [data.item.sellerId] }),
            }),
          ]);
          const catData = await catRes.json();
          const usersData = await usersRes.json();
          const foundCat = catData.categories?.find((c: Category) => c.id === data.item.categoryId);
          setCategory(foundCat || null);
          setSeller(usersData.users?.[0] || null);
        }
        setLoading(false);
      });
  }, [id]);

  const handleSendMessage = async () => {
    if (!user || !item || !message.trim()) return;

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
          itemId: item.id,
          receiverId: item.sellerId,
          content: message,
        }),
      });

      if (res.ok) {
        setMessage('');
        alert('Message sent!');
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
        <div className="text-center py-12">
          <div className="text-xl text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
        <div className="text-center py-12">
          <div className="text-xl text-gray-500">Item not found</div>
        </div>
      </div>
    );
  }

  const isSeller = item ? user?.id === item.sellerId : false;
  const canEdit = item ? (isSeller || user?.role === 'admin') : false;
  const subcategory = category?.subcategories.find(sub => sub.id === item?.subcategoryId);
  const images = item?.images && item.images.length > 0 ? item.images : [];

  const nextImage = () => {
    if (images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 leading-tight flex-1">
                  {item.title}
                </h1>
                {canEdit && onOpenEditItemSheet && item && (
                  <button
                    onClick={() => onOpenEditItemSheet(item)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
              <div className="flex items-baseline gap-4 mb-6">
                <p className="text-5xl font-bold text-gray-900">
                  {formatPrice(item.price)}
                </p>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                    item.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'sold'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-200">
              {category && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-base font-medium text-gray-900">
                    {category.name}
                    {subcategory && ` • ${subcategory.name}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="text-base font-medium text-gray-900">
                  {item.quantity} {item.quantity === 1 ? 'item' : 'items'} available
                </p>
              </div>
              {item.condition && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Condition</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {item.condition}
                  </p>
                </div>
              )}
              {item.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-900">{item.location}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Listed</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            {seller && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-3">Seller</p>
                <Link
                  href={getProfileUrl(seller.username, seller.userType)}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  {seller.avatar ? (
                    <div className="relative">
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      {seller.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{seller.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">@{seller.username}</p>
                    {seller.userType === 'shop' && (
                      <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Shop Owner
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </div>
            )}

            {/* Contact Seller */}
            {user && !isSeller && item.status === 'available' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Contact Seller
                </h3>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Send a message to the seller..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none mb-4"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim()}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}

            {!user && item.status === 'available' && (
              <Link
                href="/login"
                className="block w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
              >
                Login to contact seller
              </Link>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
              {item.description}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Force server-side rendering to avoid build-time path collection for dynamic route
export async function getServerSideProps() {
  return { props: {} };
}

