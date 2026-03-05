"use client";

import { useState, useRef, useEffect } from "react";

export interface ItineraryFormData {
  title: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  departure_city: string;
  return_city: string;
  destination: string;
  attractions: string;
  pace: "compact" | "standard" | "relaxed" | "any";
  notes: string;
}

export interface ItineraryParseTextData {
  raw_text: string;
  title: string;
  adults: number;
  children: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ItineraryFormData) => void;
  onSubmitText?: (data: ItineraryParseTextData) => void;
  loading?: boolean;
}

const PACE_OPTIONS = [
  { value: "compact", label: "紧凑" },
  { value: "standard", label: "标准" },
  { value: "relaxed", label: "松散" },
  { value: "any", label: "无要求" },
] as const;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {required && <span className="mr-0.5 text-red-500">*</span>}
      {children}
    </label>
  );
}

function InputField({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
    />
  );
}

export default function CreateItineraryModal({
  visible,
  onClose,
  onSubmit,
  onSubmitText,
  loading,
}: Props) {
  const [activeTab, setActiveTab] = useState<"form" | "text">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  // Form tab state
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [departureCity, setDepartureCity] = useState("");
  const [returnCity, setReturnCity] = useState("");
  const [destination, setDestination] = useState("");
  const [attractions, setAttractions] = useState("");
  const [pace, setPace] = useState<"compact" | "standard" | "relaxed" | "any">("standard");
  const [notes, setNotes] = useState("");

  // Text tab state
  const [rawText, setRawText] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textAdults, setTextAdults] = useState(2);
  const [textChildren, setTextChildren] = useState(0);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setErrors({});
    }
  }, [visible]);

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setAdults(2);
    setChildren(0);
    setDepartureCity("");
    setReturnCity("");
    setDestination("");
    setAttractions("");
    setPace("standard");
    setNotes("");
    setRawText("");
    setTextTitle("");
    setTextAdults(2);
    setTextChildren(0);
    setActiveTab("form");
    setErrors({});
  };

  const handleSubmit = () => {
    if (activeTab === "text") {
      const errs: Record<string, string> = {};
      if (!rawText.trim()) errs.raw_text = "请粘贴行程文本";
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      onSubmitText?.({
        raw_text: rawText,
        title: textTitle || "定制行程",
        adults: textAdults || 2,
        children: textChildren || 0,
      });
      resetForm();
      return;
    }

    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "请输入行程名称";
    if (!startDate) errs.start_date = "请选择出发日期";
    if (!endDate) errs.end_date = "请选择返回日期";
    if (!destination.trim()) errs.destination = "请输入目的地";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit({
      title,
      start_date: startDate,
      end_date: endDate,
      adults: adults || 2,
      children: children || 0,
      departure_city: departureCity,
      return_city: returnCity,
      destination,
      attractions,
      pace,
      notes,
    });
    resetForm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  if (!visible) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative mx-4 max-h-[85vh] w-full max-w-[580px] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">创建新行程</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 p-1">
          {([
            { key: "form" as const, label: "表单输入" },
            { key: "text" as const, label: "文本输入" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setErrors({}); }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Tab */}
        {activeTab === "form" && (
          <div className="space-y-4">
            {/* 行程名称 */}
            <div>
              <Label required>行程名称</Label>
              <InputField placeholder="例如：东京亲子6日游" value={title} onChange={(v) => { setTitle(v); setErrors((p) => ({...p, title: ""})); }} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* 日期 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>出发日期</Label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({...p, start_date: ""})); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
                {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
              </div>
              <div>
                <Label required>返回日期</Label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setErrors((p) => ({...p, end_date: ""})); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
                {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>}
              </div>
            </div>

            {/* 人数 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>成人数量</Label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
              </div>
              <div>
                <Label>儿童数量</Label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
              </div>
            </div>

            {/* 城市 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>落地城市</Label>
                <InputField placeholder="例如：东京" value={departureCity} onChange={setDepartureCity} />
              </div>
              <div>
                <Label>返程城市</Label>
                <InputField placeholder="例如：大阪" value={returnCity} onChange={setReturnCity} />
              </div>
            </div>

            {/* 目的地 */}
            <div>
              <Label required>目的地</Label>
              <InputField placeholder="例如：日本" value={destination} onChange={(v) => { setDestination(v); setErrors((p) => ({...p, destination: ""})); }} />
              {errors.destination && <p className="mt-1 text-xs text-red-500">{errors.destination}</p>}
            </div>

            {/* 景点 */}
            <div>
              <Label>想去的景点</Label>
              <InputField placeholder="例如：富士山、浅草寺、清水寺（逗号分隔）" value={attractions} onChange={setAttractions} />
            </div>

            {/* 节奏 */}
            <div>
              <Label>日程安排</Label>
              <div className="flex flex-wrap gap-2">
                {PACE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPace(opt.value)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      pace === opt.value
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 备注 */}
            <div>
              <Label>补充说明</Label>
              <textarea
                placeholder="其他特殊需求或偏好..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
              />
            </div>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <div>
              <Label required>行程文本</Label>
              <textarea
                placeholder={"粘贴简略行程文本，AI 将自动解析为详细方案。例如：\n\n6.17昆明接机入住酒店-自由活动-住昆明\n6.18昆明-大理 洱海-住大理\n6.19大理古城-苍山-住大理\n6.20大理-丽江 束河古镇-住丽江\n6.21丽江-泸沽湖-住泸沽湖\n6.22泸沽湖-丽江 送机"}
                rows={10}
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); setErrors((p) => ({...p, raw_text: ""})); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
              />
              {errors.raw_text && <p className="mt-1 text-xs text-red-500">{errors.raw_text}</p>}
            </div>

            <div>
              <Label>行程名称</Label>
              <InputField placeholder="例如：云南6日亲子游（可选，不填自动生成）" value={textTitle} onChange={setTextTitle} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>成人数量</Label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={textAdults}
                  onChange={(e) => setTextAdults(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
              </div>
              <div>
                <Label>儿童数量</Label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={textChildren}
                  onChange={(e) => setTextChildren(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "生成中..." : "生成行程"}
          </button>
        </div>
      </div>
    </div>
  );
}
