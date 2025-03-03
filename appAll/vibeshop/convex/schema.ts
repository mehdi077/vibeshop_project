import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    test: defineTable({
      name: v.string()
    }),

    categories: defineTable({
      name_fr: v.string(),
      name_ar: v.string(),
    }),

    products: defineTable({
      name: v.string(),
      price: v.number(),
      images: v.array(v.string()),
      description: v.optional(v.string()),
      description_images: v.optional(v.array(v.string())),
      real_images: v.optional(v.array(v.string())),
      product_id: v.string(),
      category: v.id("categories"),
    }).index("by_category", ["category"]),

    orders: defineTable({
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

})