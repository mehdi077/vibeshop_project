'use client'

import SlideByCategory from "@/components/SlideByCategory";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function Home() {
  // categories
  const categoryIds = {
    accessoires: "jh78bpbvh2djkkkjk4gpdxzstx7ag977" as Id<"categories">,
    autoAccess: "jh7drapbgcp0tvde6785g6pek17agpct" as Id<"categories">,
    pcAccess: "jh7f459hwdv9zht1wfvptzxdyn7agy2b" as Id<"categories">,
    kitchen: "jh75htsnkj4yythrjr65ta77yh7ag21g" as Id<"categories">,
    electronics: "jh7a36nf8zjcs2cpqrdfra3d4d7ags54" as Id<"categories">,
    home: "jh7b1qc314j1f5tzbma1vv5wmh7ahz7g" as Id<"categories">,
    tools: "jh7fr8p67k11k4na0za6mpx8ss7ag9d2" as Id<"categories">,
    decor: "jh788bfv78rc1jdkh75k809b7x7ag7c9" as Id<"categories">,
    fashion: "jh7azpfvrj99dpytdb09s0zcq57ahtjk" as Id<"categories">,
    beauty: "jh752w9f9bcr1sstypzjtb3g097ag31a" as Id<"categories">,
    sport: "jh7c98xfcx1mcn9g0ypcq8ahc57agd6p" as Id<"categories">,
    camping: "jh73w8ceanbm9wqr6wq8tk6mj57aggnh" as Id<"categories">,
    misc: "jh70h8s1pj3pmsg30hq6k186497agem1" as Id<"categories">,
    toys: "jh7agswn9fwfbbw80mbp820y4n7ahdjd" as Id<"categories">,
    maternity: "jh7dn0fpzxjre0yjy05qx48j8n7agjh6" as Id<"categories">,
    appliances: "jh70z4cwzzersc4726a8fyawws7ag6m0" as Id<"categories">,
    kids: "jh77g11z4r4g3pnmerf2dxrbw97ahvtg" as Id<"categories">,
    ramadan: "jh7fgpjnjhz8v5y8dstbaskrdd7agqd8" as Id<"categories">,
    specialPacks: "jh7c5bzs0mh1y2vfaqdf1dnpen7ag0jz" as Id<"categories">,
    vacation: "jh77ydygprh3gckz9krx10kvk57ahgh4" as Id<"categories">,
    clothing: "jh79hfr2t1wbr2pextnystqe4d7ah3f5" as Id<"categories">,
    seasonal: "jh76f651k30k32z9112c2m9g257am5xa" as Id<"categories">,
  };

  const categories = useQuery(api.products.getCategoryAndProductCount);
  
  // Move useEffect before any conditional returns
  useEffect(() => {
    return () => {
      // This will clean up the scroll states when navigating away from home
      const scrollContainers = document.querySelectorAll('.scrollbar-hide');
      scrollContainers.forEach(container => {
        container.scrollTo({ left: 0 });
      });
    };
  }, []);

  const getCount = (categoryId: Id<"categories">) => {
    if (!categories) return 0;
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.productCount : 0;
  };

  if (!categories) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2 max-w-md mx-auto">
      {/* category section  */}
      <div className="bg-white w-full py-2 flex justify-center">
        <div className="flex flex-wrap justify-center gap-3 max-w-7xl">
          <Link href={`/category/${categoryIds.accessoires}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/accessoirs.gif"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.autoAccess}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/carAccsses.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.pcAccess}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/pcAccesses.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.sport}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/sport.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.misc}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/divers.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.toys}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/toys.gif"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.clothing}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/vetmnts.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.specialPacks}`} className="w-[100px] h-[100px] relative rounded-[2px] shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/alerts.gif"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category`} className="w-[100px] h-[100px] relative rounded-lg shadow-md overflow-hidden">
            <Image 
              src="/images/cats_square/allCats.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
        </div>
      </div>

      {/* products section */}
      <SlideByCategory categoryId={categoryIds.beauty} totalProdCount={getCount(categoryIds.beauty)} />

      <div className="flex flex-col gap-2 py-2 bg-white justify-center">
        <Link href={`/category/${categoryIds.ramadan}`} className="w-[calc(100% - 16px)] h-[200px] relative rounded-lg shadow-md overflow-hidden mx-2">
            <Image 
              src="/images/cats_square/ramadan.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
      </div>

      <SlideByCategory categoryId={categoryIds.appliances} totalProdCount={getCount(categoryIds.appliances)} />
      <SlideByCategory categoryId={categoryIds.home} totalProdCount={getCount(categoryIds.home)} />

      <div className="flex flex-col gap-2 py-2 bg-white justify-center">
        <Link href={`/category/${categoryIds.electronics}`} className="w-[calc(100% - 16px)] h-[100px] relative rounded-[2px] shadow-md overflow-hidden mx-2">
            <Image 
              src="/images/cats_square/electros.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.camping}`} className="w-[calc(100% - 16px)] h-[100px] relative rounded-[2px] shadow-md overflow-hidden mx-2">
            <Image 
              src="/images/cats_square/camping.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/category/${categoryIds.specialPacks}`} className="w-[calc(100% - 16px)] h-[100px] relative rounded-[2px] shadow-md overflow-hidden mx-2">
            <Image 
              src="/images/cats_square/promopack.png"
              alt="Accessories Category"
              fill
              className="object-cover"
            />
          </Link>
      </div>

      <SlideByCategory categoryId={categoryIds.tools} totalProdCount={getCount(categoryIds.tools)} />
      <SlideByCategory categoryId={categoryIds.kitchen} totalProdCount={getCount(categoryIds.kitchen)} />
      <SlideByCategory categoryId={categoryIds.kids} totalProdCount={getCount(categoryIds.kids)} />
      <SlideByCategory categoryId={categoryIds.seasonal} totalProdCount={getCount(categoryIds.seasonal)} />
      <SlideByCategory categoryId={categoryIds.vacation} totalProdCount={getCount(categoryIds.vacation)} />
      <SlideByCategory categoryId={categoryIds.decor} totalProdCount={getCount(categoryIds.decor)} />
      <SlideByCategory categoryId={categoryIds.fashion} totalProdCount={getCount(categoryIds.fashion)} />
      <SlideByCategory categoryId={categoryIds.maternity} totalProdCount={getCount(categoryIds.maternity)} />

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