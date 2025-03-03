"use client"

import React from 'react'
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from 'next/link';

function Page() {
    const categories = useQuery(api.products.getCategoryAndProductCount);
    
    if (!categories) return <div>Loading...</div>;

    return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      {categories.map((category) => (
        <Link key={category._id} href={`/category/${category._id}`} className="bg-white rounded-lg shadow-md p-4 transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="font-semibold text-[15px]">{category.name_fr}</h2>
            <h2 className="font-semibold text-[15px]">{category.name_ar}</h2>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 text-[12px] w-[110px] text-right"> <span className="font-semibold">{category.productCount}</span> produits</span>
            <span className="ml-2 text-gray-500">→</span>
          </div>
        </Link>
      ))}
      
    </div>
    );
  
}

export default Page