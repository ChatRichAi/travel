"use client";

import { Input } from "@arco-design/web-react";
import ImageUploadSlot from "./ImageUploadSlot";

const { TextArea } = Input;

interface Props {
  label: string;
  icon: string;
  value: string;
  onChange: (val: string) => void;
  images: string[];
  itineraryId: number;
  dayId: number;
  section: string;
  onImageUploaded: (url: string) => void;
  onImageDeleted: (url: string) => void;
}

export default function DaySectionEditor({
  label,
  icon,
  value,
  onChange,
  images,
  itineraryId,
  dayId,
  section,
  onImageUploaded,
  onImageDeleted,
}: Props) {
  const slots = [0, 1, 2];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <TextArea
        value={value}
        onChange={onChange}
        autoSize={{ minRows: 2, maxRows: 6 }}
        className="!text-sm"
      />
      <div className="flex gap-2">
        {slots.map((i) => (
          <ImageUploadSlot
            key={i}
            imageUrl={images[i] || null}
            itineraryId={itineraryId}
            dayId={dayId}
            section={section}
            onUploaded={onImageUploaded}
            onDeleted={onImageDeleted}
          />
        ))}
      </div>
    </div>
  );
}
