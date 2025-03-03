
import React, { Suspense } from 'react'
import SearchContent from '@/components/SearchContent'

export default function SearchPage() {
  

  return (
    
    <Suspense fallback={<div>Loading search results...</div>}>
      <SearchContent />
    </Suspense>
  )
} 