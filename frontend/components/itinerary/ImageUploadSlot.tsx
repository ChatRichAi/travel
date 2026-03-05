"use client";

import { useRef, useState } from "react";
import { Spin, Message } from "@arco-design/web-react";
import { IconPlus, IconDelete } from "@arco-design/web-react/icon";
import api from "@/lib/api";

interface Props {
  imageUrl: string | null;
  itineraryId: number;
  dayId: number;
  section: string;
  onUploaded: (url: string) => void;
  onDeleted: (url: string) => void;
}

export default function ImageUploadSlot({
  imageUrl,
  itineraryId,
  dayId,
  section,
  onUploaded,
  onDeleted,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section", section);

    setUploading(true);
    try {
      const res = await api.post(
        `/itinerary/${itineraryId}/days/${dayId}/upload-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onUploaded(res.data.url);
    } catch {
      Message.error("图片上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    try {
      await api.delete(
        `/itinerary/${itineraryId}/days/${dayId}/image`,
        { params: { section, url: imageUrl } }
      );
      onDeleted(imageUrl);
    } catch {
      Message.error("删除图片失败");
    }
  };

  if (imageUrl) {
    return (
      <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        <button
          onClick={handleDelete}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <IconDelete className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] dark:border-gray-600"
    >
      {uploading ? <Spin size={16} /> : <IconPlus />}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
