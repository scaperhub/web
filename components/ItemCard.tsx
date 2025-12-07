import Link from 'next/link';
import { Item } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { MapPin, Tag } from 'lucide-react';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all cursor-pointer group">
        <div className="aspect-w-16 aspect-h-9 bg-gray-50 overflow-hidden">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-64 bg-gray-50 flex items-center justify-center">
              <Tag className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-xl font-semibold text-gray-900 mb-3">
            {formatPrice(item.price)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            {item.location && (
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                item.status === 'available'
                  ? 'bg-green-50 text-green-700'
                  : item.status === 'sold'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

