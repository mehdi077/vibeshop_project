import { Search } from "lucide-react";
import Form from "next/form";


export default function SearchBar() {
  return (
    <div className="w-full max-w-3xl px-2">
      <Form action='/search' className="relative flex gap-2">
          <input
            type="text"
            name="q"
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
  );
}