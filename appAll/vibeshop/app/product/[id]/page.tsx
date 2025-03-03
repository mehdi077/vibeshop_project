'use client'

import React, { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import Link from 'next/link'
import ImagePreview from '@/components/ImagePreview'
import { Phone, ShoppingCart, Loader2 } from 'lucide-react'
import { useEffect } from 'react';
import '@/skeleton.css'

function ProductPage() {
  const params = useParams()
  const productId = params.id as Id<"products">
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedRealImageIndex, setSelectedRealImageIndex] = useState<number>(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isRealPreviewOpen, setIsRealPreviewOpen] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasTrackedViewContent = useRef(false);
  
  
  const product = useQuery(api.products.getProductById, {
    productId
  })

  const category = useQuery(api.products.getCategoryById, 
    !product?.category ? "skip" : { 
      categoryId: product.category 
    }
  )

  useEffect(() => {
    if (!hasTrackedViewContent.current && typeof window !== "undefined" && typeof window.fbq === "function" && product) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: [productId],
        content_type: 'product',
        value: product.price,
        currency: 'DZD'
      });
      console.log("Facebook ViewContent event sent!");
      hasTrackedViewContent.current = true; // Prevent future duplicate events
    }
  }, [product]);
  
  const handleBuyClick = async () => {
    setIsLoading(true)
    

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq('track', 'InitiateCheckout', { 
        value: product?.price,
        currency: 'DZD',
        content_name: product?.name,
        content_ids: [productId, product?.category],
        content_type: 'product'
      });
      
      console.log("Facebook InitiateCheckout event sent!");
    } else {
      console.warn("Facebook Pixel is not loaded yet.");
    }
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      window.location.href = `/checkout/${productId}`
    } catch (error) {
      console.error("Error during purchase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while data is being fetched
  if (!product || !category) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="loader"></div>
        <style jsx>{`
          .loader {
            border: 8px solid #e0e0e0; /* Light gray */
            border-top: 8px solid #3498db; /* Blue */
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    )
  }

  return (
    
    <div className="min-h-screen mb-2 max-w-md mx-auto">
      
      <div className="bg-white w-full py-1 px-4">
        <div className="text-[15px] whitespace-nowrap overflow-x-auto scrollbar-hide flex items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 flex-shrink-0">Accueil</Link>
          <span className="mx-2 text-gray-600 flex-shrink-0">{'>'}</span>
          <Link href={`/category/${category._id}`} className="text-gray-600 hover:text-gray-800 flex-shrink-0">{category.name_fr}</Link>
          <span className="mx-2 text-gray-600 flex-shrink-0">{'>'}</span>
          <span className="font-bold flex-shrink-0">{product.name}</span>
        </div>
      </div>

      <div className="w-full p-2 bg-gray-300">
        <div className="w-full overflow-x-auto flex gap-2 snap-x snap-mandatory">
          {product.images.map((image, index) => (
            <div 
              key={index}
              className={`flex-none w-[90%] snap-center cursor-pointer ${index === selectedImageIndex ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => {
                setSelectedImageIndex(index)
                setIsPreviewOpen(true)
              }}
            >
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full h-auto object-contain rounded-sm"
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white px-4 py-4 shadow-lg rounded-lg border border-gray-200">
        <h1 className="text-[17px] text-gray-800 font-semibold">{product.name}</h1>
        <p className="text-[23px] font-bold mt-2 mb-1 text-black">{product.price} DA</p>
        <div className="flex items-center mt-2">
          <button className="bg-green-500 text-white text-sm font-medium rounded-md px-3 py-1 hover:bg-blue-600 transition duration-200">
            Produit disponible
          </button>
        </div>
      </div>

      {product.real_images && product.real_images.length > 0 && (
        <div className="bg-white mx-2 mt-2 p-2 rounded-[2px]">
          <h2 className="text-[15px] font-medium mb-2 text-gray-700">Photos réelles du produit</h2>
          <div className="w-full overflow-x-auto flex gap-2 snap-x snap-mandatory">
            {product.real_images.map((image, index) => (
              <div 
                key={index}
                className="flex-none w-[45%] snap-center cursor-pointer"
                onClick={() => {
                  setSelectedRealImageIndex(index)
                  setIsRealPreviewOpen(true)
                }}
              >
                <img
                  src={image}
                  alt={`Real product image ${index + 1}`}
                  className="w-full h-auto object-contain rounded-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white mx-2 mt-2 p-3 rounded-[2px]">
        <h2 className="text-[15px] font-medium mb-2 text-gray-700">Description</h2>
        {product.description ? (
          <div>
            <div 
              className={`text-[14px] text-gray-600 whitespace-pre-wrap leading-relaxed relative ${
                !isDescriptionExpanded ? "max-h-[100px] overflow-hidden" : ""
              }`}
            >
              <p>{product.description}</p>
              {!isDescriptionExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-2 text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              {isDescriptionExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        ) : (
          <p className="text-[14px] text-gray-500 italic">Aucune description disponible</p>
        )}
      </div>

      {product.description_images && product.description_images.length > 0 && (
        <div className="w-full bg-white mt-2">
          <div className="flex flex-col">
            {product.description_images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Description image ${index + 1}`}
                className="w-full h-auto"
              />
            ))}
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <ImagePreview
          images={product.images}
          selectedIndex={selectedImageIndex}
          onClose={() => setIsPreviewOpen(false)}
          onImageSelect={setSelectedImageIndex}
        />
      )}

      {isRealPreviewOpen && product.real_images && (
        <ImagePreview
          images={product.real_images}
          selectedIndex={selectedRealImageIndex}
          onClose={() => setIsRealPreviewOpen(false)}
          onImageSelect={setSelectedRealImageIndex}
        />
      )}

      {/* Sticky bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center h-[60px] px-4 py-2 gap-2 max-w-md mx-auto">
        <button
          onClick={() => window.location.href = "tel:+213792107513"}
          className="aspect-square h-full flex items-center justify-center border-2 border-[#102161] bg-white rounded-md"
        >
          <Phone className="h-6 w-6 text-[#102161]" />
        </button>
        <button
          onClick={handleBuyClick}
          disabled={isLoading}
          className={`flex-1 h-full bg-[#102161] text-white rounded-sm flex items-center justify-center gap-2 font-bold text-base shadow-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-6 w-6" />
              <span> Acheter - اطلب </span>
            </>
          )}
        </button>
      </div>

      {/* Add padding to prevent content from being hidden behind the sticky bar */}
      <div className="h-[60px]" />
    </div>
  )
}

export default ProductPage