"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Button,
  Slider,
  Input,
  Message,
  Spin,
  Select,
  Space,
} from "@arco-design/web-react";
import { IconSave } from "@arco-design/web-react/icon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import api, { swrFetcher } from "@/lib/api";
import CostCategoryEditor, { CostCategory } from "./CostCategoryEditor";

const { TextArea } = Input;

interface PricingData {
  id?: number;
  itinerary_id: number;
  adult_count: number;
  child_count: number;
  vehicle_costs: CostCategory;
  accommodation_costs: CostCategory;
  ticket_costs: CostCategory;
  insurance_costs: CostCategory;
  special_costs: CostCategory;
  cost_total: number;
  profit_margin: number;
  quote_total: number;
  estimated_profit: number;
  per_adult_price: number | null;
  per_child_price: number | null;
  show_price: boolean;
  fees_included: string;
  fees_excluded: string;
  fee_notes: string;
  extra_notes: string;
}

interface FeeTemplate {
  id: number;
  name: string;
  type: string;
  content: string;
}

const emptyCost: CostCategory = { items: [], adult_total: 0, child_total: 0, total: 0 };

const defaultPricing = (itineraryId: number): PricingData => ({
  itinerary_id: itineraryId,
  adult_count: 2,
  child_count: 0,
  vehicle_costs: { ...emptyCost },
  accommodation_costs: { ...emptyCost },
  ticket_costs: { ...emptyCost },
  insurance_costs: { ...emptyCost },
  special_costs: { ...emptyCost },
  cost_total: 0,
  profit_margin: 0.25,
  quote_total: 0,
  estimated_profit: 0,
  per_adult_price: null,
  per_child_price: null,
  show_price: false,
  fees_included: "",
  fees_excluded: "",
  fee_notes: "",
  extra_notes: "",
});

interface Props {
  itineraryId: number;
}

export default function PricingPage({ itineraryId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState<PricingData>(defaultPricing(itineraryId));
  const [isNew, setIsNew] = useState(true);

  // Fetch existing pricing
  const { data: existingPricing, isLoading } = useSWR<PricingData>(
    `/pricing/${itineraryId}`,
    swrFetcher,
    { onError: () => {} } // 404 is expected for new
  );

  // Fetch fee templates
  const { data: templates = [] } = useSWR<FeeTemplate[]>(
    "/pricing/templates/fees",
    swrFetcher
  );

  useEffect(() => {
    if (existingPricing?.id) {
      setPricing(existingPricing);
      setIsNew(false);
    }
  }, [existingPricing]);

  // Recalculate on cost changes
  const recalculate = useCallback((p: PricingData): PricingData => {
    const costTotal =
      (p.vehicle_costs?.total || 0) +
      (p.accommodation_costs?.total || 0) +
      (p.ticket_costs?.total || 0) +
      (p.insurance_costs?.total || 0) +
      (p.special_costs?.total || 0);

    const margin = p.profit_margin || 0.25;
    const quoteTotal = margin < 1 ? costTotal / (1 - margin) : costTotal;
    const profit = quoteTotal - costTotal;
    const pax = (p.adult_count || 0) + (p.child_count || 0);
    const perPerson = pax > 0 ? quoteTotal / pax : quoteTotal;

    return {
      ...p,
      cost_total: costTotal,
      quote_total: quoteTotal,
      estimated_profit: profit,
      per_adult_price: perPerson,
      per_child_price: perPerson,
    };
  }, []);

  const updateCost = (field: keyof PricingData, value: CostCategory) => {
    setPricing((prev) => recalculate({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post(`/pricing/${itineraryId}`, pricing);
        setIsNew(false);
      } else {
        await api.put(`/pricing/${itineraryId}`, pricing);
      }
      Message.success("核价保存成功");
    } catch {
      Message.error("保存失败");
    } finally {
      setSaving(false);
    }
  }, [itineraryId, pricing, isNew]);

  const applyTemplate = (type: string, templateId: number) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    const fieldMap: Record<string, keyof PricingData> = {
      included: "fees_included",
      excluded: "fees_excluded",
      notes: "fee_notes",
    };
    const field = fieldMap[type];
    if (field) {
      setPricing((prev) => ({ ...prev, [field]: tmpl.content }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size={32} />
      </div>
    );
  }

  const costCategories: { key: keyof PricingData; title: string; icon: string }[] = [
    { key: "vehicle_costs", title: "包车费用", icon: "🚗" },
    { key: "accommodation_costs", title: "住宿费用", icon: "🏨" },
    { key: "ticket_costs", title: "门票费用", icon: "🎫" },
    { key: "insurance_costs", title: "保险费用", icon: "🛡" },
    { key: "special_costs", title: "特色项目", icon: "⭐" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/itinerary/${itineraryId}`)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            行程核价
          </h2>
        </div>
        <Button
          type="primary"
          icon={<IconSave />}
          loading={saving}
          onClick={handleSave}
          className="!bg-[var(--color-brand)] !border-[var(--color-brand)]"
        >
          保存
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Summary Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">报价概览</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <span className="text-xs text-gray-500">成本合计</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {pricing.cost_total.toFixed(0)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">总报价</span>
                <p className="text-lg font-bold text-[var(--color-brand)]">
                  {pricing.quote_total.toFixed(0)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">预估利润</span>
                <p className="text-lg font-bold text-red-500">
                  {pricing.estimated_profit.toFixed(0)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">人均报价</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(pricing.per_adult_price || 0).toFixed(0)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  利润率 {(pricing.profit_margin * 100).toFixed(0)}%
                </span>
                <Slider
                  value={pricing.profit_margin * 100}
                  min={0}
                  max={60}
                  step={1}
                  onChange={(v) => {
                    const val = (typeof v === "number" ? v : v[0]) / 100;
                    setPricing((prev) => recalculate({ ...prev, profit_margin: val }));
                  }}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Cost Categories */}
          {costCategories.map((cat) => (
            <CostCategoryEditor
              key={cat.key}
              title={cat.title}
              icon={cat.icon}
              data={(pricing[cat.key] as CostCategory) || emptyCost}
              onChange={(v) => updateCost(cat.key, v)}
            />
          ))}

          {/* Fee Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">费用说明</h3>
            <div className="space-y-4">
              {[
                { label: "费用包含", field: "fees_included" as const, type: "included" },
                { label: "费用不含", field: "fees_excluded" as const, type: "excluded" },
                { label: "费用说明", field: "fee_notes" as const, type: "notes" },
              ].map((item) => {
                const typeTemplates = templates.filter((t) => t.type === item.type);
                return (
                  <div key={item.field}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-gray-500">{item.label}</label>
                      {typeTemplates.length > 0 && (
                        <Select
                          size="mini"
                          placeholder="使用模板"
                          style={{ width: 140 }}
                          onChange={(v) => applyTemplate(item.type, v)}
                          options={typeTemplates.map((t) => ({ label: t.name, value: t.id }))}
                        />
                      )}
                    </div>
                    <TextArea
                      value={(pricing[item.field] as string) || ""}
                      onChange={(v) => setPricing((prev) => ({ ...prev, [item.field]: v }))}
                      autoSize={{ minRows: 3, maxRows: 8 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
