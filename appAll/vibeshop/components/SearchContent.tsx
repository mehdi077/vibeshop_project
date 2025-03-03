"use client"
import Link from "next/link"
import { ShoppingCart, Search } from "lucide-react"
import Form from "next/form"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSearchParams } from 'next/navigation'
import { useEffect } from "react"

function SearchContent() {

    const searchParams = useSearchParams()
    const searchQuery = searchParams.get('q') || ''
    
    const searchResults = useQuery(api.products.searchProducts, {
        searchQuery
    })

    useEffect(() => {
      if (searchResults && searchResults.length > 0 && typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "Search");
        console.log("Facebook Search event triggered!");
      }
    }, [searchResults]); 

    

  return (
    <div className="min-h-screen pb-4">
        {/* Search Bar */}
        <div className="sticky top-0 bg-white shadow-sm z-10 py-2">
          <div className="w-full max-w-3xl px-2 mx-auto">
            <Form action='/search' className="relative flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Rechercher un produit..."
                className="w-full h-[39px] px-4 text-sm border rounded-lg bg-[#E5EAED] focus:outline-none focus:ring-1 focus:ring-[#0068D7] focus:border-[#0068D7]"
              />
              <button
                type="submit"
                className="h-[39px] sm:px-4 bg-[#0068D7] text-white rounded-lg hover:bg-[#0068D7]/90 transition-colors flex items-center justify-center sm:justify-start sm:gap-2 sm:text-[14px] w-[39px] sm:w-auto"
                aria-label="Rechercher"
              >
                <Search size={15} className="relative lg:-top-[1px]" />
                <span className="hidden sm:inline">Rechercher</span>
              </button>
            </Form>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-3xl mx-auto px-2 mt-4">
          {searchQuery ? (
            <>
              <h1 className="text-lg font-semibold mb-4">
                {searchResults?.length === 0 
                  ? 'Aucun résultat trouvé' 
                  : `Résultats pour "${searchQuery}"`
                }
              </h1>

              {!searchResults ? (
                // Loading state
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[2px] shadow-md overflow-hidden animate-pulse">
                      <div className="h-[200px] bg-gray-200" />
                      <div className="p-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {searchResults.map((product) => (
                    <Link 
                      href={`/product/${product._id}`} 
                      key={product._id} 
                      className="bg-white rounded-[2px] shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-[200px]">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-[12px] text-gray-800 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <p className="text-[14px] font-bold text-gray-900">
                          {product.price.toLocaleString()} DA
                        </p>

                        <div className="mt-2">
                          <button 
                            className="w-full bg-[#102161] text-white py-1 rounded-[2px] hover:opacity-90 transition flex items-center justify-center gap-2"
                            onClick={(e) => {
                              e.preventDefault()
                              window.location.href = `/product/${product._id}`
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
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              Entrez un terme de recherche pour trouver des produits
            </div>
          )}
        </div>
      </div>
  )
}

export default SearchContent