import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewProps {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
  onImageSelect: (index: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  selectedIndex,
  onClose,
  onImageSelect,
}) => {
  const thumbnailRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (thumbnailRef.current) {
      thumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedIndex]);

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : images.length - 1;
    onImageSelect(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < images.length - 1 ? selectedIndex + 1 : 0;
    onImageSelect(newIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      {/* Close button */}
      

      {/* Main image container */}
      <div className="w-full h-[70vh] flex items-center justify-center px-4">
        {/* Main image */}
        <img
          src={images[selectedIndex]}
          alt={`Preview ${selectedIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Image counter */}
      <div className="text-white text-lg mt-4">
        {selectedIndex + 1} / {images.length}
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-8 mt-2 mb-4">
        
        <button
          onClick={handlePrevious}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={40} />
        </button>

        <button
          onClick={handleNext}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ChevronRight size={40} />
        </button>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        >
          <X size={34} />
        </button>
      </div>

      {/* Thumbnail navigation */}
      <div className="w-full px-4">
        <div className="max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-4" style={{ scrollBehavior: 'smooth' }}>
            {images.map((image, index) => (
              <button
                key={index}
                ref={index === selectedIndex ? thumbnailRef : null}
                onClick={() => onImageSelect(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all
                  ${index === selectedIndex 
                    ? 'ring-2 ring-white opacity-100 scale-110' 
                    : 'ring-1 ring-gray-400 opacity-50 hover:opacity-75'}`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;