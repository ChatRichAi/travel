"use client";

import { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Message,
  Space,
  Pagination,
} from "@arco-design/web-react";
import { IconSearch, IconFilter, IconDownload } from "@arco-design/web-react/icon";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";

interface FinanceRecord {
  id: number;
  order_id: string;
  type: string;
  amount: number;
  payer: string;
  payee: string;
  method: string;
  status: string;
  date: string;
  notes?: string;
}

interface PaginatedResponse {
  items: FinanceRecord[];
  total: number;
  page: number;
  page_size: number;
}

const statusColorMap: Record<string, string> = {
  pending: "orangered",
  approved: "arcoblue",
  paid: "green",
  rejected: "red",
};

const statusLabelMap: Record<string, string> = {
  pending: "待处理",
  approved: "已审批",
  paid: "已付款",
  rejected: "已拒绝",
};

const typeLabel: Record<string, string> = {
  sales_pay: "销售付款",
  sales_receive: "销售收款",
  planner_pay: "计调付款",
  planner_receive: "计调收款",
  supplier: "供应商付款",
  customer_collection: "客户收款",
  local_agent: "地接对账",
};

const methodLabel: Record<string, string> = {
  bank_transfer: "银行转账",
  wechat: "微信支付",
  alipay: "支付宝",
  cash: "现金",
  corporate_transfer: "对公转账",
  other: "其他",
};

export default function PaymentRecordsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  const swrKey = `/finance/records?${params.toString()}`;

  const { data, isLoading } = useSWR<PaginatedResponse>(swrKey, swrFetcher, {
    keepPreviousData: true,
  });

  const filteredItems = data?.items?.filter((item) => {
    const matchSearch = searchText
      ? item.order_id?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.payer?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.payee?.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchType = typeFilter ? item.type === typeFilter : true;
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchType && matchStatus;
  });

  const handleExport = () => {
    Message.info("导出功能即将推出");
  };

  const columns = [
    {
      title: "订单号",
      dataIndex: "order_id",
      width: 140,
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 110,
      render: (val: string) => (
        <Tag size="small" color="arcoblue">
          {typeLabel[val] || val}
        </Tag>
      ),
    },
    {
      title: "金额(¥)",
      dataIndex: "amount",
      width: 130,
      render: (val: number) => (
        <span className="font-semibold text-brand-700 dark:text-brand-300">
          ¥{val?.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "付款方",
      dataIndex: "payer",
      width: 130,
    },
    {
      title: "收款方",
      dataIndex: "payee",
      width: 130,
    },
    {
      title: "方式",
      dataIndex: "method",
      width: 100,
      render: (val: string) => methodLabel[val] || val,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (val: string) => (
        <Tag color={statusColorMap[val] || "gray"} size="small">
          {statusLabelMap[val] || val}
        </Tag>
      ),
    },
    {
      title: "日期",
      dataIndex: "date",
      width: 120,
    },
    {
      title: "备注",
      dataIndex: "notes",
      width: 160,
      render: (val: string) => (
        <span className="text-gray-500 dark:text-gray-400 truncate block max-w-[140px]">
          {val || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">付款记录</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {data?.total ?? 0} 条记录
          </p>
        </div>
        <Button
          icon={<IconDownload />}
          onClick={handleExport}
          className="!border-brand !text-brand hover:!bg-brand-50 dark:hover:!bg-brand-900/20"
        >
          导出记录
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索订单号/付款方/收款方..."
          value={searchText}
          onChange={setSearchText}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder="类型筛选"
          value={typeFilter || undefined}
          onChange={(val) => {
            setTypeFilter(val || "");
          }}
          allowClear
          style={{ width: 150 }}
          prefix={<IconFilter />}
        >
          {Object.entries(typeLabel).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(val) => {
            setStatusFilter(val || "");
          }}
          allowClear
          style={{ width: 150 }}
        >
          {Object.entries(statusLabelMap).map(([key, label]) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={filteredItems || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={false}
          noDataElement={
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">暂无数据</div>
          }
        />
        {(data?.total ?? 0) > 0 && (
          <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700">
            <Pagination
              total={data?.total ?? 0}
              current={page}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              showTotal
              sizeCanChange
              sizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
