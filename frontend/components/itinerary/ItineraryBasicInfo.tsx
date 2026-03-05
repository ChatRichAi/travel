"use client";

import { Input, InputNumber, Grid } from "@arco-design/web-react";
import type { Itinerary } from "@/types";

const { TextArea } = Input;

interface Props {
  itinerary: Itinerary;
  onChange: (field: string, value: unknown) => void;
}

export default function ItineraryBasicInfo({ itinerary, onChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">基本信息</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">行程名称</label>
          <Input
            value={itinerary.title}
            onChange={(v) => onChange("title", v)}
          />
        </div>

        <Grid.Row gutter={16}>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">目的地</label>
            <Input
              value={itinerary.destination || ""}
              onChange={(v) => onChange("destination", v)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">出发城市</label>
            <Input
              value={itinerary.departure_city || ""}
              onChange={(v) => onChange("departure_city", v)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">返程城市</label>
            <Input
              value={itinerary.return_city || ""}
              onChange={(v) => onChange("return_city", v)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">日程节奏</label>
            <Input
              value={itinerary.pace || "standard"}
              onChange={(v) => onChange("pace", v)}
            />
          </Grid.Col>
        </Grid.Row>

        <Grid.Row gutter={16}>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">开始日期</label>
            <Input value={itinerary.start_date?.slice(0, 10) || ""} disabled />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">结束日期</label>
            <Input value={itinerary.end_date?.slice(0, 10) || ""} disabled />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">成人</label>
            <InputNumber
              value={itinerary.adults || 2}
              min={1}
              onChange={(v) => onChange("adults", v)}
              style={{ width: "100%" }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <label className="mb-1 block text-xs text-gray-500">儿童</label>
            <InputNumber
              value={itinerary.children || 0}
              min={0}
              onChange={(v) => onChange("children", v)}
              style={{ width: "100%" }}
            />
          </Grid.Col>
        </Grid.Row>

        <div>
          <label className="mb-1 block text-xs text-gray-500">行程亮点</label>
          <TextArea
            value={itinerary.highlights || ""}
            onChange={(v) => onChange("highlights", v)}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">注意事项</label>
          <TextArea
            value={itinerary.notes || ""}
            onChange={(v) => onChange("notes", v)}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
