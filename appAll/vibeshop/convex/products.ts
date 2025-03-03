import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { PRODUCTS_PER_PAGE } from "./constants";
import { MARGIN, BIG_MARGIN, PRICE_ABOVE } from "@/convex/constants";

export const getAllCategories = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name_fr: v.string(),
      name_ar: v.string(),
    })
  ),
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories;
  },
});

export const getProductsByCategory = query({
  args: {
    categoryId: v.id("categories"),
    limit: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      price: v.number(),
      images: v.array(v.string()),
      description: v.optional(v.string()),
      description_images: v.optional(v.array(v.string())),
      real_images: v.optional(v.array(v.string())),
      product_id: v.string(),
      category: v.id("categories"),
    })
  ),
  handler: async (ctx, args) => {
    
    
    if (args.limit > 0) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.categoryId))
        .take(args.limit);
      const productsWithMargin = products.map(product => ({
        ...product,
        price: product.price > PRICE_ABOVE ? product.price + BIG_MARGIN : product.price + MARGIN
      }));
      return productsWithMargin;

    } else {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.categoryId))
        .collect();
      const productsWithMargin = products.map(product => ({
        ...product,
        price: product.price > PRICE_ABOVE ? product.price + BIG_MARGIN : product.price + MARGIN
      }));
      return productsWithMargin;
    }

    
  },
});

export const getProductById = query({
  args: {
    productId: v.id("products"),
  },
  returns: v.object({
    _id: v.id("products"),
    _creationTime: v.number(),
    name: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    description: v.optional(v.string()),
    description_images: v.optional(v.array(v.string())),
    real_images: v.optional(v.array(v.string())),
    product_id: v.string(),
    category: v.id("categories"),
  }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    const productWithMargin = {
      ...product,
      price: product.price > PRICE_ABOVE ? product.price + BIG_MARGIN : product.price + MARGIN
    };
    return productWithMargin;
  },
});

export const getCategoryById = query({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name_fr: v.string(),
    name_ar: v.string(),
  }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },
});

export const getProductCountByCategory = query({
  args: {
    categoryId: v.id("categories"),
  },
  returns: v.object({
    totalProducts: v.number(),
    totalPages: v.number(),
  }),
  handler: async (ctx, args) => {
    return ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.categoryId))
      .collect()
      .then((products) => {
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
        return {
          totalProducts,
          totalPages,
        };
      });
  },
});

export const getProductsByCategoryPaginated = query({
  args: {
    categoryId: v.id("categories"),
    page: v.number(),
  },
  returns: v.object({
    products: v.array(
      v.object({
        _id: v.id("products"),
        _creationTime: v.number(),
        name: v.string(),
        price: v.number(),
        images: v.array(v.string()),
        description: v.optional(v.string()),
        description_images: v.optional(v.array(v.string())),
        real_images: v.optional(v.array(v.string())),
        product_id: v.string(),
        category: v.id("categories"),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const skip = (args.page - 1) * PRODUCTS_PER_PAGE;

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.categoryId))
      .collect()
      .then((allProducts) => {
        const paginatedProducts = allProducts.slice(skip, skip + PRODUCTS_PER_PAGE);
        return {
          products: paginatedProducts,
        };
      });
    const productsWithMargin = products.products.map(product => ({
      ...product,
      price: product.price > PRICE_ABOVE ? product.price + BIG_MARGIN : product.price + MARGIN
    }));
    return { products: productsWithMargin };
  },
});

export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    product_id: v.string(),
    quantity: v.number(),
    fullName: v.string(),
    phoneNumber: v.number(),
    selectedWilaya: v.string(),
    selectedDeliveryType: v.string(),
    deliveryAddress: v.optional(v.string()),
    exactAddress: v.optional(v.string()),
    orderRemarks: v.optional(v.string()),
    totalPrice: v.number(),
  },
  returns: v.object({
    _id: v.id("orders"),
    _creationTime: v.number(),
    product: v.id("products"),
    product_id: v.string(),
    quantity: v.number(),
    full_name: v.string(),
    phone_number: v.number(),
    selected_wilaya: v.string(),
    selected_delivery_type: v.string(),
    delivery_address: v.optional(v.string()),
    exact_address: v.optional(v.string()),
    order_remarks: v.optional(v.string()),
    total_price: v.number(),
  }),
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      product: args.productId,
      product_id: args.product_id,
      quantity: args.quantity,
      full_name: args.fullName,
      phone_number: args.phoneNumber,
      selected_wilaya: args.selectedWilaya,
      selected_delivery_type: args.selectedDeliveryType,
      delivery_address: args.deliveryAddress,
      exact_address: args.exactAddress,
      order_remarks: args.orderRemarks,
      total_price: args.totalPrice,
    });

    // Fetch the complete order object after insertion
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found"); // Handle case where order is not found
    }
    return order; // Ensure we return the complete order object
  },


}); 


export const getCategoryAndProductCount = query({
  args: {},
  handler: async (ctx) => {
    const categoriesAndProductCount = await ctx.db
      .query("categories")
      .collect()
      .then((categories) => {
        const categoriesAndProductCount = Promise.all(categories.map(async (category) => {
        const productCount = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", category._id))
          .collect()
          .then((products) => products.length);
        
        return {
          _id: category._id,
          name_fr: category.name_fr,
          name_ar: category.name_ar,
          productCount,
        }
      }))
    return categoriesAndProductCount;
  })
  return categoriesAndProductCount
}})
    

export const searchProducts = query({
  args: {
    searchQuery: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("products"),
      _creationTime: v.number(),
      name: v.string(),
      price: v.number(),
      images: v.array(v.string()),
      description: v.optional(v.string()),
      description_images: v.optional(v.array(v.string())),
      real_images: v.optional(v.array(v.string())),
      product_id: v.string(),
      category: v.id("categories"),
    })
  ),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .collect();

    const searchResults = products.filter(product => 
      product.name.toLowerCase().includes(args.searchQuery.toLowerCase())
    );

    const productsWithMargin = searchResults.map(product => ({
      ...product,
      price: product.price > PRICE_ABOVE ? product.price + BIG_MARGIN : product.price + MARGIN
      //
    }));
    return productsWithMargin;
  },
});


