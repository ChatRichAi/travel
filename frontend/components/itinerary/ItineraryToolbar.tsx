"use client";

import { Button, Space } from "@arco-design/web-react";
import { IconSave } from "@arco-design/web-react/icon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalculator } from "@fortawesome/free-solid-svg-icons";

interface Props {
  title: string;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onPricing: () => void;
}

export default function ItineraryToolbar({
  title,
  saving,
  onBack,
  onSave,
  onPricing,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      <Space>
        <Button
          type="outline"
          icon={<FontAwesomeIcon icon={faCalculator} className="mr-1" />}
          onClick={onPricing}
        >
          行程核价
        </Button>
        <Button
          type="primary"
          icon={<IconSave />}
          loading={saving}
          onClick={onSave}
          className="!bg-[var(--color-brand)] !border-[var(--color-brand)]"
        >
          保存
        </Button>
      </Space>
    </div>
  );
}
