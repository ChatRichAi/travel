"use client";

import { useState } from "react";
import useSWR from "swr";
import { Tabs, Spin, Empty, Pagination, Typography } from "@arco-design/web-react";
import { swrFetcher } from "@/lib/api";
import PlanCard from "./PlanCard";
import type { Itinerary, PaginatedList } from "@/types";

const TabPane = Tabs.TabPane;

const TABS = [
  { key: "personal", label: "个人方案" },
  { key: "closed", label: "成交方案" },
  { key: "featured", label: "精华方案" },
  { key: "shared", label: "历史方案" },
];

export default function PlanLibrary() {
  const [activeTab, setActiveTab] = useState("personal");
  const [page, setPage] = useState(1);

  const swrKey = `/itinerary/library?tab=${activeTab}&page=${page}&page_size=12`;
  const { data, isLoading, mutate } = useSWR<PaginatedList<Itinerary>>(swrKey, swrFetcher);

  const plans = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <Typography.Title heading={4} className="!mb-0 !text-gray-900 dark:!text-white">
        方案库
      </Typography.Title>

      <Tabs activeTab={activeTab} onChange={(key) => { setActiveTab(key); setPage(1); }}>
        {TABS.map((tab) => (
          <TabPane key={tab.key} title={tab.label} />
        ))}
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size={32} />
        </div>
      ) : plans.length === 0 ? (
        <Empty description="暂无方案" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onTagChange={() => mutate()} />
            ))}
          </div>
          {total > 12 && (
            <div className="flex justify-end">
              <Pagination
                total={total}
                current={page}
                pageSize={12}
                onChange={setPage}
                showTotal
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
