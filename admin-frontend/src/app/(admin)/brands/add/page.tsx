"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import * as Toast from "@radix-ui/react-toast";

interface Brand {
  id: number;
  name: string;
  description?: string;
  img?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// First upload image to get URL
const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}brands/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload image");
  }

  const data = await response.json();
  return data.url;
};

// Then create brand with image URL
const createBrand = async (brandData: {
  name: string;
  description?: string;
  img?: string;
}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}brands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create brand");
  }

  return response.json();
};

export default function AddBrandPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setToastOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        showToast("Only image files are allowed (jpg, jpeg, png, gif, webp)", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must not exceed 5MB", "error");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createBrandMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      showToast("✅ Brand created successfully", "success");
      setTimeout(() => {
        router.push("/brands");
      }, 1500);
    },
    onError: (error: Error) => {
      showToast(`❌ ${error.message || "Connection problem"}`, "error");
    },
    onSettled: () => {
      setIsSubmitting(false);
      setIsUploading(false);
    },
  });

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name) {
      showToast("Name is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "";

      // Upload image first if exists
      if (image) {
        setIsUploading(true);
        imageUrl = await uploadImage(image);
      }

      // Create brand with image URL
      createBrandMutation.mutate({
        name,
        description: description || undefined,
        img: imageUrl || undefined,
      });
    } catch (error) {
      showToast(`❌ ${error instanceof Error ? error.message : "Failed to upload image"}`, "error");
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.push("/brands");
  };

  return (
    <Toast.Provider>
      <div className="p-6">
        <PageBreadcrumb pageTitle="Add New Brand" />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleCancel}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            ← Back to List
          </button>
        </div>

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Brand Information
            </h3>
          </div>

          <form onSubmit={submitForm}>
            <div className="p-6.5">
              <div className="grid grid-cols-1 gap-6">
                {/* Name */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Brand Image
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Accepted formats: JPG, JPEG, PNG, GIF, WEBP (Max: 5MB)
                  </p>

                  {imagePreview && (
                    <div className="mt-4 text-center">
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-lg border object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-stroke px-6 py-3 font-medium hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="rounded-md border border-stroke px-6 py-3 font-medium hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-2"></div>
                      {isUploading ? "Uploading image..." : "Creating..."}
                    </>
                  ) : (
                    "Create Brand"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Toast Notifications */}
        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={`fixed top-20 right-4 w-80 rounded-md p-4 shadow-lg z-50 ${toastType === "success"
            ? "bg-green-600 dark:bg-green-700 text-white"
            : "bg-red-600 dark:bg-red-700 text-white"
            }`}
          duration={3000}
        >
          <Toast.Title className="font-medium">{toastMsg}</Toast.Title>
        </Toast.Root>
        <Toast.Viewport className="fixed top-4 right-4 z-50 outline-none" />
      </div>
    </Toast.Provider>
  );
}