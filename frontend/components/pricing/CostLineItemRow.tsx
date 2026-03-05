"use client";

import { InputNumber, Input, Button } from "@arco-design/web-react";
import { IconDelete } from "@arco-design/web-react/icon";

export interface CostLineItem {
  name: string;
  adult_price: number;
  child_price: number;
  quantity: number;
  days: number;
  subtotal: number;
}

interface Props {
  item: CostLineItem;
  onChange: (item: CostLineItem) => void;
  onDelete: () => void;
}

export default function CostLineItemRow({ item, onChange, onDelete }: Props) {
  const recalc = (changes: Partial<CostLineItem>) => {
    const next = { ...item, ...changes };
    next.subtotal = (next.adult_price + next.child_price) * next.quantity * next.days;
    onChange(next);
  };

  return (
    <div className="grid grid-cols-[1fr_80px_80px_60px_60px_90px_32px] items-center gap-2">
      <Input
        size="small"
        value={item.name}
        onChange={(v) => recalc({ name: v })}
        placeholder="项目名称"
      />
      <InputNumber
        size="small"
        value={item.adult_price}
        min={0}
        onChange={(v) => recalc({ adult_price: v ?? 0 })}
        placeholder="大人"
      />
      <InputNumber
        size="small"
        value={item.child_price}
        min={0}
        onChange={(v) => recalc({ child_price: v ?? 0 })}
        placeholder="小孩"
      />
      <InputNumber
        size="small"
        value={item.quantity}
        min={1}
        onChange={(v) => recalc({ quantity: v ?? 1 })}
      />
      <InputNumber
        size="small"
        value={item.days}
        min={1}
        onChange={(v) => recalc({ days: v ?? 1 })}
      />
      <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
        {item.subtotal.toFixed(0)}
      </span>
      <Button
        type="text"
        size="mini"
        icon={<IconDelete />}
        onClick={onDelete}
        className="!text-gray-400 hover:!text-red-500"
      />
    </div>
  );
}
