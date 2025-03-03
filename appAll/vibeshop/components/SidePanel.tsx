import React, { FC, useEffect, useState } from 'react';
import { X, ChevronRight, Loader2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  _id: string;
  _creationTime: number;
  name_fr: string;
  name_ar: string;
}

const SidePanel: FC<SidePanelProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const data = useQuery(api.products.getAllCategories);

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  return (
    <div 
      className={`
        fixed top-0 left-0 h-full w-80 max-w-[90vw]
        bg-gradient-to-b from-blue-50 to-indigo-50 
        shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white text-black shadow-sm">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categories
        </h1>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-blue-700 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
        {!data ? (
          <div className="flex items-center justify-center h-20 text-blue-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-500">
            <Tag className="h-5 w-5 mr-2" />
            <p className="text-sm">No categories available</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li 
                key={category._id} 
                className="
                  px-3 py-2 rounded-lg
                  bg-white
                  hover:bg-blue-100 
                  transition-all duration-200
                  group
                  shadow-sm
                "
              >
                <Link 
                  href={`/category/${category._id}`} 
                  onClick={onClose}
                  className="
                    flex items-center justify-between text-sm
                    text-blue-800 
                    group-hover:text-blue-900
                    transition-colors
                  "
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{category.name_fr}</span>
                    <span className="text-blue-600 text-xs">{category.name_ar}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-blue-500 group-hover:text-blue-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SidePanel;