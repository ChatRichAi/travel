"use client";

import { Button } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import CostLineItemRow, { CostLineItem } from "./CostLineItemRow";

export interface CostCategory {
  items: CostLineItem[];
  adult_total: number;
  child_total: number;
  total: number;
}

interface Props {
  title: string;
  icon: string;
  data: CostCategory;
  onChange: (data: CostCategory) => void;
}

function recalcCategory(items: CostLineItem[]): CostCategory {
  let adult_total = 0;
  let child_total = 0;
  let total = 0;
  for (const item of items) {
    adult_total += item.adult_price * item.quantity * item.days;
    child_total += item.child_price * item.quantity * item.days;
    total += item.subtotal;
  }
  return { items, adult_total, child_total, total };
}

export default function CostCategoryEditor({ title, icon, data, onChange }: Props) {
  const handleItemChange = (index: number, item: CostLineItem) => {
    const items = [...data.items];
    items[index] = item;
    onChange(recalcCategory(items));
  };

  const handleDelete = (index: number) => {
    const items = data.items.filter((_, i) => i !== index);
    onChange(recalcCategory(items));
  };

  const handleAdd = () => {
    const items = [
      ...data.items,
      { name: "", adult_price: 0, child_price: 0, quantity: 1, days: 1, subtotal: 0 },
    ];
    onChange(recalcCategory(items));
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <span>{icon}</span> {title}
        </h4>
        <span className="text-sm font-bold text-[var(--color-brand)]">
          {data.total.toFixed(0)}
        </span>
      </div>

      {/* Header */}
      <div className="mb-2 grid grid-cols-[1fr_80px_80px_60px_60px_90px_32px] gap-2 text-xs text-gray-500">
        <span>项目</span>
        <span>大人价</span>
        <span>小孩价</span>
        <span>数量</span>
        <span>天数</span>
        <span className="text-right">小计</span>
        <span />
      </div>

      <div className="space-y-2">
        {data.items.map((item, i) => (
          <CostLineItemRow
            key={i}
            item={item}
            onChange={(v) => handleItemChange(i, v)}
            onDelete={() => handleDelete(i)}
          />
        ))}
      </div>

      <Button
        type="text"
        size="small"
        icon={<IconPlus />}
        onClick={handleAdd}
        className="mt-2"
      >
        添加项目
      </Button>
    </div>
  );
}
