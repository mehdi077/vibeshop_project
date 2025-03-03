'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { PRODUCTS_PER_PAGE } from "@/convex/constants";

interface CategoryPageProps {
  params: Promise<{
    id: Id<"categories">
  }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = React.use(params);
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedProducts = useQuery(api.products.getProductsByCategoryPaginated, {
    categoryId: resolvedParams.id,
    page: currentPage
  });

  const productCount = useQuery(api.products.getProductCountByCategory, {
    categoryId: resolvedParams.id
  });
  
  const category = useQuery(api.products.getCategoryById, { categoryId: resolvedParams.id });

  // Scroll to top when data arrives
  useEffect(() => {
    if (paginatedProducts && category && productCount) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [paginatedProducts, category, productCount]);

  if (!paginatedProducts || !category || !productCount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-[2px] shadow-md overflow-hidden w-[calc(100%-4px)] cursor-pointer">
              <div className="relative h-[200px]">
                <div className="w-full h-full bg-gray-200 animate-pulse rounded-md"></div>
              </div>
              <div className="py-2 px-2">
                <div className="mt-4 h-4 bg-gray-200 animate-pulse rounded"></div>
                <div className="mt-2 h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const startItem = ((currentPage - 1) * PRODUCTS_PER_PAGE) + 1;
  const endItem = Math.min(currentPage * PRODUCTS_PER_PAGE, productCount.totalProducts);

  return (
    <div className="bg-white w-full max-w-md mx-auto">
        <div className="bg-white w-full py-1 px-4">
            <div className="text-[15px] whitespace-nowrap overflow-x-auto scrollbar-hide flex items-center">
                <Link href="/" className="text-gray-600 hover:text-gray-800 flex-shrink-0">Accueil</Link>
                <span className="mx-2 text-gray-600 flex-shrink-0">{'>'}</span>
                <span className="font-bold flex-shrink-0">{category.name_fr}</span>
            </div>
        </div>
        <div className="bg-gray-200 w-full py-1">
            <h1 className="text-[16px] font-bold mb-2 mt-2 text-gray-700 max-w-7xl mx-auto px-2">{category.name_fr.toUpperCase()}</h1>
            
            <div className="flex justify-between items-center max-w-7xl mx-auto px-2 mb-2">
                <span className="text-[12px] text-gray-600">
                    Page {currentPage} sur {productCount.totalPages}
                </span>
                <span className="text-[12px] text-gray-600">
                    {startItem}-{endItem} sur {productCount.totalProducts} produits
                </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-7xl px-2">
                {paginatedProducts.products.map((product) => (
                    <Link 
                        href={`/product/${product._id}`} 
                        key={product._id} 
                        className="bg-white rounded-[2px] shadow-md overflow-hidden w-[calc(50%-4px)] cursor-pointer hover:shadow-lg transition-shadow"
                    >
                        <div className="relative h-[200px]">
                            <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="py-2 px-2">
                            <h3 className="text-[12px] text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                            
                            <p className="text-[14px] font-bold text-gray-900 mt-1">
                                {product.price.toLocaleString()} DA
                            </p>

                            <div className="mt-2">
                                <button 
                                    className="w-full bg-[#102161] text-white py-1 rounded-[2px] hover:opacity-90 transition flex items-center justify-center gap-2"
                                    onClick={(e) => {
                                        
                                        e.preventDefault();
                                        // window.location.href = `/checkout/${product._id}`;
                                        if (typeof window !== "undefined" && typeof window.fbq === "function") {
                                            window.fbq('track', 'InitiateCheckout', { 
                                                value: product?.price, 
                                                currency: 'DZD',
                                                content_name: product?.name,
                                                content_ids: [product._id, product.category],
                                                content_type: 'product'
                                            });
                                
                                            console.log("Facebook InitiateCheckout event sent!");
                                
                                            // Add a slight delay to ensure the event is tracked before navigating
                                            setTimeout(() => {
                                                window.location.href = `/checkout/${product._id}`;
                                            }, 500); // Delay of 500ms
                                        } else {
                                            console.warn("Facebook Pixel is not loaded yet.");  
                                            // Navigate anyway if Pixel isn't available
                                            window.location.href = `/checkout/${product._id}`;
                                        }
                                    }}
                                >
                                    <ShoppingCart size={14} />
                                    <span className="font-bold text-[12px]">Acheter</span>
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center py-4 px-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        disabled={currentPage === 1}
                        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded ${
                            currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        } text-[12px]`}
                    >
                        ←
                    </button>

                    <div className="flex items-center max-w-[200px] overflow-x-auto scrollbar-hide whitespace-nowrap gap-2">
                        {[...Array(productCount.totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => {
                                    setCurrentPage(index + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded ${
                                    currentPage === index + 1
                                        ? 'bg-[#102161] text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                } text-[12px]`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (currentPage < productCount.totalPages) {
                                setCurrentPage(currentPage + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        disabled={currentPage === productCount.totalPages}
                        className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded ${
                            currentPage === productCount.totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        } text-[12px]`}
                    >
                        →
                    </button>
                </div>
            </div>
        </div>  
    </div>
  );
}