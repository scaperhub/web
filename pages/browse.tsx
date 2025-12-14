import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ItemCard from '@/components/ItemCard';
import Footer from '@/components/Footer';
import { Item, Category, User } from '@/lib/types';

interface BrowseProps {
  user: User | null;
  onLogout: () => void;
  onOpenSellSheet?: () => void;
}

export default function Browse({ user, onLogout, onOpenSellSheet }: BrowseProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/items?status=available').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
    ]).then(([itemsData, categoriesData]) => {
      setItems(itemsData.items || []);
      setCategories(categoriesData.categories || []);
      setLoading(false);
    });
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={user} onLogout={onLogout} onOpenSellSheet={onOpenSellSheet} />
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Browse Items</h1>
          <p className="text-sm text-gray-500">{filteredItems.length} items available</p>
        </div>

        <div className="mb-12 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="text-sm text-gray-400">Loading items...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-base text-gray-400">No items found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

