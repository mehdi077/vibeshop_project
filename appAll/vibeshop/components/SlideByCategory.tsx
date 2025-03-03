'use client'

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import ProductCard from "@/components/ProductCard";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import '@/styles/scrollbar.css';
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

interface SlideByCategoryProps {
  categoryId: Id<"categories">;
  totalProdCount: number;
}

export default function SlideByCategory({ categoryId, totalProdCount }: SlideByCategoryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const productLimit = 8
  const products = useQuery(api.products.getProductsByCategory, {
    categoryId,
    limit: productLimit
  });
  
  const category = useQuery(api.products.getCategoryById, {
    categoryId,
  });

  const totalProducts = totalProdCount;

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting && 
            !hasScrolledRef.current && 
            scrollContainer.scrollWidth > scrollContainer.clientWidth
          ) {
            // Scroll to show the next item
            const scrollAmount = 150; // Approximate width of one product card + gap
            scrollContainer.scrollTo({
              left: scrollAmount,
              behavior: 'smooth'
            });

            // Wait a bit, then scroll back
            setTimeout(() => {
              scrollContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
              });
            }, 1000);

            hasScrolledRef.current = true;
          }
        });
      },
      {
        threshold: 0.8, // Trigger when 80% of the element is visible
        rootMargin: '-10% 0px -10% 0px' // Only trigger when element is in the middle 80% of viewport
      }
    );

    observer.observe(scrollContainer);

    return () => {
      observer.disconnect();
    };
  }, [products]); // Re-run when products are loaded

  if (!products || !category || !totalProducts) {
    return (
    <div className="w-full py-4 px-1 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-[120px] bg-white rounded-[2px] shadow-sm overflow-hidden">
                <div className="relative h-[120px] bg-gray-200 animate-pulse flex items-center justify-center">
                  <Image
                    src="/public/images/M_logo.svg"
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
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="w-full bg-white">
      <div className="w-full py-1 bg-gradient-to-r from-[#102161] to-[#5dd1e4]">
        <div className="max-w-7xl mx-auto pr-4 pl-1">
          <div className="flex justify-between items-center">
            <div className="text-[15px] text-white lg:text-full">
              <span className="hidden lg:inline">{category.name_fr + ' - ' + category.name_ar}</span>
              <span className="lg:hidden">{truncateText(category.name_fr + ' - ' + category.name_ar, 35)}</span>
            </div>
            <div className="flex items-center bg-white rounded-xl">
              <Link href={`/category/${categoryId}`}>
                <button className="text-[13px] font-bold px-2" style={{ color: '#102161' }}>Voir plus →</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full pt-2 px-1">
        <div className="max-w-7xl mx-auto">
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide"
          >
            <div className="flex gap-4 pb-4">
              {products?.map((product) => (
                <ProductCard key={product._id} productId={product._id} />
              ))}
              {totalProducts && totalProducts > productLimit && (
                <Link href={`/category/${categoryId}`} className="flex-shrink-0 w-[120px] h-[165px] relative rounded-lg shadow-md overflow-hidden group">
                  <Image 
                    src="/images/view_more.png"
                    alt="Accessories Category"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center p-2">
                    <span className="text-sm">Voir plus de</span>
                    <span className="text-2xl font-bold">{totalProducts - productLimit}</span>
                    <span className="text-sm">produits</span>
                    <ArrowRight className="mt-2 w-5 h-5" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this CSS to hide scrollbar but keep functionality
const styles = `
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 