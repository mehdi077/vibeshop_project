import React from 'react'
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  productId: Id<"products">;
  width?: number;
}

function ProductCard({ productId, width = 120 }: ProductCardProps) {
  const product = useQuery(api.products.getProductById, { productId });

  if (!product) {
    return (
      <div className={`w-[${width}px] bg-white rounded-[2px] shadow-sm overflow-hidden`}>
        <div className={`relative h-[${width}px] bg-gray-200 animate-pulse flex items-center justify-center`}>
          <Image
            src="/app/favicon.ico"
            alt="Loading"
            width={24}
            height={24}
            className="opacity-30"
          />
        </div>
        <div className="px-2 pt-1">
          <div className="h-[10px] bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="px-2 pb-1 mt-2">
          <div className="h-[14px] w-2/3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/product/${product._id}`}>
      <div className={`w-[${width}px] bg-white rounded-[2px] shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col`}>
        {/* Image Section */}
        <div className={`relative h-[120px]`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Title Section */}
        <div className="px-2 pt-1">
          <h3 className="text-[10px] font-medium text-gray-800 truncate">
            {product.name}
          </h3>
        </div>
        
        {/* Price Section */}
        <div className="px-2 pb-1 mt-2">
          <p className="text-[14px] font-semibold text-gray-900">
            {product.price.toLocaleString()} DA
          </p>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard