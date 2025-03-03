Implementing Multiple Image Uploads with Convex API


Below is one effective strategy to support uploading multiple images with Convex. The idea is to leverage Convex’s file storage via upload URLs—the same mechanism used for single images—and simply handle an array of files on the client. You generate one upload URL per image, POST each file individually, collect the returned storage IDs, and then update your document (for example, a post) with an array of image storage IDs. You can also choose an HTTP action that handles multi‑part uploads if you need to bundle files in one request for smaller images. However, the upload–URL approach is generally preferred for arbitrarily large files and is very flexible.

Below is an example implementation.

---

## 1. Backend: Generate an Upload URL

Keep your single‑upload URL mutation almost as in the Convex docs. It can be reused for multiple files by calling it separately for each file.

```typescript:convex/messages.ts
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  // Generate a short-lived URL for uploading one file.
  return await ctx.storage.generateUploadUrl();
});
```

*Reference: [Convex File Storage Documentation](https://docs.convex.dev/file-storage/upload-files)*

---

## 2. Backend: Mutation to Update a Post With Multiple Images

Your schema already defines the `posts` table with an optional `images` field as an array of strings. You can create a mutation that appends (or replaces) the list of image storage IDs on a post.

For example, you might add an `addPostImages` mutation as follows:

```typescript:convex/posts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { POST_STATUS, DURATIONS } from "./constants";

// ...existing mutations and queries

// Mutation to add images to a post (accumulating any existing images)
export const addPostImages = mutation({
  args: { postId: v.id("posts"), images: v.array(v.string()) },
  handler: async (ctx, { postId, images }) => {
    // Retrieve the current post to see if there are already images.
    const post = await ctx.db.get(postId);
    const currentImages = post?.images || [];
    // Append new images to the already stored images.
    await ctx.db.patch(postId, { images: [...currentImages, ...images] });
    return { success: true };
  },
});
```

*Tip:* If you wish to replace rather than accumulate images, simply set the post’s `images` field to the new array.

---

## 3. Client-Side: Uploading Multiple Images

Here’s an example React component that allows a user to select multiple image files, uploads each one via its own upload URL, collects the resulting storage IDs, and then updates the post document via the mutation defined above.

```typescript:src/MultipleImageUploader.tsx
import { FormEvent, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function MultipleImageUploader({ postId }: { postId: string }) {
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const addPostImages = useMutation(api.posts.addPostImages);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      const storageIds: string[] = [];

      // Iterate through each selected file
      for (const file of selectedFiles) {
        // Generate an upload URL for each file
        const uploadUrl = await generateUploadUrl();
        // POST the file to the URL
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await response.json();
        storageIds.push(storageId);
      }

      // Call the mutation to associate the uploaded images with the post
      await addPostImages({ postId, images: storageIds });

      // Reset the file input
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) {
            // Convert FileList to an array
            setSelectedFiles(Array.from(e.target.files));
          }
        }}
        disabled={uploading}
      />
      <button type="submit" disabled={uploading || selectedFiles.length === 0}>
        {uploading ? "Uploading..." : "Upload Images"}
      </button>
    </form>
  );
}
```

*Usage:* Include this component in your post creation or editing page and pass the appropriate `postId` to attach images to that post.

---

## 4. Alternative Approach: Using HTTP Actions

If you want a single endpoint that accepts a multi‑part form for multiple small images (keeping in mind the 20MB request limit), you could write an HTTP action that parses the form data, calls `ctx.storage.store` for each file, and returns an aggregated list of storage IDs. This approach is more complex because you must parse multipart requests and set proper CORS headers but can be more convenient in some cases. For further details, see the [Convex HTTP Actions documentation](https://docs.convex.dev/file-storage/upload-files).

---

## In Summary

- **Reuse the Upload URL Mutation:** Call it once per file.
- **Collect Storage IDs:** Upload multiple files serially or in parallel.
- **Update the Database:** Add or update the target document (e.g., a post) with the array of storage IDs.
- **Client Integration:** Use a multi‑file input that iterates over files and triggers the upload/mutation process.

This approach closely follows the Convex documentation for single-image uploads but extends it naturally for multiple files. It also fits neatly into a project with your current schema (see your `convex/schema.ts`) where the `posts` table defines an optional array field for storing image IDs.

---

## References

- [Convex File Storage Uploads](https://docs.convex.dev/file-storage/upload-files)  
- [Tickiter – Real-time Event Ticketing Platform (Reference Implementation)](https://github.com/sonnysangha/ticket-marketplace-saas-nextjs15-convex-clerk-stripe-connect)

Using these patterns, you can scale your file upload endpoints to support multiple images efficiently.

------|---------------------------------|----------|-----------------
-----------------------------|------------------------------|--------
------------|---------------------------------|----------------------
--------------------|------------|------------------------|----------
--|----------------------|-----------------------------|-------------
--------|---------------------------|--------------------------|-----
API Endpoints Creation for Form Filling

I'll help you implement the API endpoints for managing categories, subcategories, brands, and models. After analyzing the requirements, I'll implement the first approach with separate endpoints for better separation of concerns, type safety, and clearer error handling.

Let me edit the `admin.ts` file:

```typescript:convex/admin.ts
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { POST_STATUS, DURATIONS } from "./constants";

// Add multiple categories at once
export const addCategories = mutation({
  args: {
    categories: v.array(v.object({ name: v.string() })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const category of args.categories) {
      // Check if category already exists to avoid duplicates
      const existing = await ctx.db
        .query("categories")
        .filter((q) => q.eq(q.field("name"), category.name))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("categories", { name: category.name });
        results.push({ id, name: category.name, status: "created" });
      } else {
        results.push({ id: existing._id, name: category.name, status: "already_exists" });
      }
    }
    return results;
  },
});

// Add subcategories linked to a specific category
export const addSubcategories = mutation({
  args: {
    categoryId: v.id("categories"),
    subcategories: v.array(v.object({ name: v.string() })),
  },
  handler: async (ctx, args) => {
    // First verify that the category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const results = [];
    for (const subcategory of args.subcategories) {
      // Check if subcategory already exists in this category
      const existing = await ctx.db
        .query("subcategories")
        .withIndex("by_category", (q) => q.eq("category", args.categoryId))
        .filter((q) => q.eq(q.field("name"), subcategory.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("subcategories", {
          name: subcategory.name,
          category: args.categoryId,
        });
        results.push({ id, name: subcategory.name, status: "created" });
      } else {
        results.push({ id: existing._id, name: subcategory.name, status: "already_exists" });
      }
    }
    return results;
  },
});

// Add multiple brands at once
export const addBrands = mutation({
  args: {
    brands: v.array(v.object({ name: v.string() })),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const brand of args.brands) {
      // Check if brand already exists
      const existing = await ctx.db
        .query("brands")
        .filter((q) => q.eq(q.field("name"), brand.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("brands", { name: brand.name });
        results.push({ id, name: brand.name, status: "created" });
      } else {
        results.push({ id: existing._id, name: brand.name, status: "already_exists" });
      }
    }
    return results;
  },
});

// Add models linked to a specific brand
export const addModels = mutation({
  args: {
    brandId: v.id("brands"),
    models: v.array(v.object({ name: v.string() })),
  },
  handler: async (ctx, args) => {
    // First verify that the brand exists
    const brand = await ctx.db.get(args.brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }

    const results = [];
    for (const model of args.models) {
      // Check if model already exists for this brand
      const existing = await ctx.db
        .query("models")
        .withIndex("by_brand", (q) => q.eq("brand", args.brandId))
        .filter((q) => q.eq(q.field("name"), model.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("models", {
          name: model.name,
          brand: args.brandId,
        });
        results.push({ id, name: model.name, status: "created" });
      } else {
        results.push({ id: existing._id, name: model.name, status: "already_exists" });
      }
    }
    return results;
  },
});
```


I chose the first approach (separate endpoints) for several reasons:

1. **Better Separation of Concerns**: Each endpoint has a clear, single responsibility
2. **Type Safety**: Each endpoint has its own clearly defined input types
3. **Explicit Error Handling**: We can handle errors specific to each operation
4. **Better Performance Control**: We can optimize each operation independently
5. **Clearer Usage Patterns**: The API is more intuitive to use

Here's how to use each endpoint with examples:

1. Adding Categories:
```typescript
// Add single category
const result = await converse.mutation(api.admin.addCategories, {
  categories: [{ name: "Electronics" }]
});

// Add multiple categories
const result = await converse.mutation(api.admin.addCategories, {
  categories: [
    { name: "Electronics" },
    { name: "Vehicles" },
    { name: "Real Estate" }
  ]
});
```

2. Adding Subcategories:
```typescript
// First get the category ID (assuming we added Electronics)
const categoryId = "..."; // from the previous addCategories result
const result = await converse.mutation(api.admin.addSubcategories, {
  categoryId,
  subcategories: [
    { name: "Smartphones" },
    { name: "Laptops" },
    { name: "Tablets" }
  ]
});
```

3. Adding Brands:
```typescript
// Add multiple brands at once
const result = await converse.mutation(api.admin.addBrands, {
  brands: [
    { name: "Toyota" },
    { name: "Honda" },
    { name: "Ford" }
  ]
});
```

4. Adding Models:
```typescript
// Add models for Toyota
const brandId = "..."; // from the previous addBrands result
const result = await converse.mutation(api.admin.addModels, {
  brandId,
  models: [
    { name: "Camry" },
    { name: "Corolla" },
    { name: "RAV4" }
  ]
});
```

Key features of this implementation:

1. **Bulk Operations**: All endpoints support adding multiple items at once
2. **Duplicate Prevention**: Checks for existing items before adding
3. **Detailed Results**: Returns status for each item (created/already_exists)
4. **Relationship Validation**: Verifies parent entities exist (category/brand)
5. **Index Usage**: Uses appropriate indexes for efficient queries
6. **Error Handling**: Clear error messages for invalid operations

Why this approach is better than combining endpoints:
1. **Clearer Intent**: Each operation is explicit about what it's doing
2. **Atomic Operations**: Each operation can be rolled back independently
3. **Better Error Handling**: Specific error messages for each operation type
4. **Simpler Validation**: Each endpoint has its own validation rules
5. **Easier Testing**: Can test each operation in isolation
6. **Better Performance**: Can optimize each operation independently
7. **Clearer Documentation**: Each endpoint is self-documenting

Would you like me to explain any part in more detail or show how to implement any specific use case?
------|---------------------------------|----------|-----------------
-----------------------------|------------------------------|--------
------------|---------------------------------|----------------------
--------------------|------------|------------------------|----------
--|----------------------|-----------------------------|-------------
--------|---------------------------|--------------------------|-----

in this exact div, based on the api endoints in @form.ts @storage.ts and based on the schema of the data in @schema.ts and look for the best approch for the task online using the convex docs @Web :
buld a neatly done form, where there is 7 fields:
1 - brand => dropdown that shows brands brought from the approperiate api endpoint, where the dropdown is searchabale, like when clicked the options appear and the first option is a text box (that appear and despear alongside the options list of the dropdown) where when tyed into it it desplays the avilable options for fast and easy find for the desired option (this style of the dropdown desgine must be done with all dropdowns in this build)
2 - model => a dropdown the same as 
described above, but now the options must appear based on the selected brand
3 - year => dropdown same as above always based on the approperiate api endpointes
4 and 5 => do the same thing with "category" and "sub-category" as the logic in "brand" and "model"
-----------
then a small text to seperate the fields above with the one below saying "* your contact informations :"
-----------
6 - phone number => this must be a text box, that expect to have a phone number 10degit long otherwise the borders of the textbox becomes red (indicating not 10 digit proivded)
7 - wilaya => also a drop down, the same logic as above, based on the approperiat api endoints alwys
----------------------------------------
the upload button : in @actions , create a helper file that handles the upload task, where the button should accept image files only, and when selected, and before actually uploading, in the same div as the upload button, build a small image preview, to see the images that are about to be uploaded, and a small x at the top right corner of each image to be able to delete the SELECTION.
also make the image uploading section a reuirment, saying in text description that the user must upload at least 1 image.
------------------------------------------
now this is the very sensible part that you should be very carful and thoughtful when trying to implement:
after all the informations provide, use the api endpoints in @posts.ts and @storage.ts to handle adding all the informations into the convex database as effecintly as possible.
----------------------------------------
analyse the exisitng codes that are in the api files, to know better how to imolement each step.

---------------------------------------------------------------------

ok. there is a slight bug, when clicked on the filter button that shows only in md and sm, it pops out the filter componenet as desired and everything works well, but when i choose some options from the drop down, and hit the x to remove the filter popup, and once i click the filter again (all i am talking while in sm and md) those options i slected (while in the backend they are selected) but are not visible, even the tags are not visible, becasue when i selcted them i hit x, and when clicked again i should see exactly as i seen before clicking X, becasue i didn't yet clicked the cancel filter button.
apply the changes