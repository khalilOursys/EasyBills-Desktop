"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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

const fetchBrand = async (id: string): Promise<Brand> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/getBrandById/${id}`);
  if (!response.ok) throw new Error("Failed to fetch brand");
  return response.json();
};

// Upload image if changed
const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/upload`, {
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

// Update brand with new data
const updateBrand = async ({ id, data }: { id: string; data: Partial<Brand> }) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update brand");
  }

  return response.json();
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditBrandPage({ params }: PageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return <EditBrandContent id={resolvedParams.id} />;
}

function EditBrandContent({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { data: brand, isLoading: isLoadingBrand } = useQuery({
    queryKey: ["brand", id],
    queryFn: () => fetchBrand(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setDescription(brand.description || "");
      setExistingImage(brand.img || null);
    }
  }, [brand]);

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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setToastOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: updateBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brand", id] });
      showToast("✅ Brand updated successfully", "success");
      setTimeout(() => router.push("/brands"), 1500);
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
      let imageUrl = existingImage || "";

      // Upload new image if changed
      if (image) {
        setIsUploading(true);
        imageUrl = await uploadImage(image);
      }

      // Prepare update data
      const updateData: Partial<Brand> = {
        name,
        description: description || undefined,
      };

      // Only include img if it changed
      if (imageUrl !== existingImage) {
        updateData.img = imageUrl;
      }

      // Update brand
      updateMutation.mutate({ id, data: updateData });
    } catch (error) {
      showToast(`❌ ${error instanceof Error ? error.message : "Failed to upload image"}`, "error");
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleCancel = () => router.push("/brands");

  if (isLoadingBrand) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <Toast.Provider>
      <div className="p-6">
        <PageBreadcrumb pageTitle="Edit Brand" />

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
              Edit Brand
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
                    Accepted formats: JPG, JPEG, PNG, GIF, WEBP (Max: 5MB). Leave empty to keep current image.
                  </p>

                  {(imagePreview || existingImage) && (
                    <div className="mt-4 text-center">
                      <p className="mb-2 text-sm font-medium text-black dark:text-white">Preview:</p>
                      <img
                        src={imagePreview || existingImage || ""}
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
                      {isUploading ? "Uploading image..." : "Updating..."}
                    </>
                  ) : (
                    "Update Brand"
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