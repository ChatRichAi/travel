"use client";

import { useState, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Message,
  Space,
  Pagination,
} from "@arco-design/web-react";
import { IconPlus, IconSearch, IconFilter } from "@arco-design/web-react/icon";
import useSWR, { mutate } from "swr";
import api, { swrFetcher } from "@/lib/api";

const FormItem = Form.Item;
const { RangePicker } = DatePicker;

type PaymentType =
  | "sales_pay"
  | "sales_receive"
  | "planner_pay"
  | "planner_receive"
  | "supplier"
  | "customer_collection"
  | "local_agent";

type PaymentStatus = "pending" | "approved" | "paid" | "rejected";

interface Payment {
  id: number;
  order_id: string;
  amount: number;
  payer: string;
  payee: string;
  method: string;
  type: PaymentType;
  status: PaymentStatus;
  date: string;
  notes?: string;
  attachment_url?: string;
  created_at: string;
}

interface PaginatedResponse {
  items: Payment[];
  total: number;
  page: number;
  page_size: number;
}

interface PaymentTableProps {
  paymentType?: PaymentType;
  title: string;
}

const statusColorMap: Record<PaymentStatus, string> = {
  pending: "orangered",
  approved: "arcoblue",
  paid: "green",
  rejected: "red",
};

const statusLabelMap: Record<PaymentStatus, string> = {
  pending: "待处理",
  approved: "已审批",
  paid: "已付款",
  rejected: "已拒绝",
};

const typeLabel: Record<PaymentType, string> = {
  sales_pay: "销售付款",
  sales_receive: "销售收款",
  planner_pay: "计调付款",
  planner_receive: "计调收款",
  supplier: "供应商付款",
  customer_collection: "客户收款",
  local_agent: "地接对账",
};

const methodOptions = [
  { label: "银行转账", value: "bank_transfer" },
  { label: "微信支付", value: "wechat" },
  { label: "支付宝", value: "alipay" },
  { label: "现金", value: "cash" },
  { label: "对公转账", value: "corporate_transfer" },
  { label: "其他", value: "other" },
];

export default function PaymentTable({ paymentType, title }: PaymentTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Build SWR key
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (paymentType) params.set("type", paymentType);
    if (statusFilter) params.set("status", statusFilter);
    if (searchText) params.set("order_id", searchText);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return `/payment?${params.toString()}`;
  }, [paymentType, statusFilter, searchText, page, pageSize]);

  const { data, isLoading } = useSWR<PaginatedResponse>(swrKey, swrFetcher, {
    keepPreviousData: true,
  });

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      await api.post("/payment", {
        ...values,
        type: paymentType || values.type,
      });
      Message.success("付款记录已创建");
      setModalVisible(false);
      mutate(swrKey);
    } catch {
      Message.error("创建失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.patch(`/payment/${id}/status`, { status });
      Message.success(status === "approved" ? "已审批通过" : "已拒绝");
      mutate(swrKey);
    } catch {
      Message.error("操作失败");
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此付款记录吗？",
      okButtonProps: { status: "danger" },
      onOk: async () => {
        try {
          await api.delete(`/payment/${id}`);
          Message.success("已删除");
          mutate(swrKey);
        } catch {
          Message.error("删除失败");
        }
      },
    });
  };

  const columns = [
    {
      title: "订单号",
      dataIndex: "order_id",
      width: 140,
    },
    {
      title: "金额(¥)",
      dataIndex: "amount",
      width: 120,
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
      render: (val: string) => {
        const found = methodOptions.find((m) => m.value === val);
        return found ? found.label : val;
      },
    },
    ...(!paymentType
      ? [
          {
            title: "类型",
            dataIndex: "type",
            width: 110,
            render: (val: PaymentType) => typeLabel[val] || val,
          },
        ]
      : []),
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (val: PaymentStatus) => (
        <Tag color={statusColorMap[val]} size="small">
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
      title: "操作",
      dataIndex: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: unknown, record: Payment) => (
        <Space size={4}>
          {record.status === "pending" && (
            <>
              <Button
                type="text"
                size="small"
                status="success"
                onClick={() => handleStatusChange(record.id, "approved")}
              >
                审批
              </Button>
              <Button
                type="text"
                size="small"
                status="danger"
                onClick={() => handleStatusChange(record.id, "rejected")}
              >
                拒绝
              </Button>
            </>
          )}
          <Button
            type="text"
            size="small"
            status="danger"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {data?.total ?? 0} 条记录
          </p>
        </div>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={handleAdd}
          className="!bg-brand !border-brand hover:!bg-brand-dark"
        >
          新增记录
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索订单号..."
          value={searchText}
          onChange={(val) => {
            setSearchText(val);
            setPage(1);
          }}
          allowClear
          style={{ width: 220 }}
        />
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(val) => {
            setStatusFilter(val || "");
            setPage(1);
          }}
          allowClear
          style={{ width: 150 }}
          prefix={<IconFilter />}
        >
          <Select.Option value="pending">待处理</Select.Option>
          <Select.Option value="approved">已审批</Select.Option>
          <Select.Option value="paid">已付款</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
        </Select>
        <RangePicker
          placeholder={["开始日期", "结束日期"]}
          onChange={(_dateString, value) => {
            setDateRange((value || []).map((v) => String(v)));
            setPage(1);
          }}
          style={{ width: 260 }}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={false}
          noDataElement={
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              暂无数据
            </div>
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

      {/* Add Payment Modal */}
      <Modal
        title="新增付款记录"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText="提交"
        cancelText="取消"
        unmountOnExit
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem label="订单号" field="order_id" rules={[{ required: true, message: "请输入订单号" }]}>
            <Input placeholder="请输入订单号" />
          </FormItem>
          <FormItem label="金额" field="amount" rules={[{ required: true, message: "请输入金额" }]}>
            <Input prefix="¥" placeholder="0.00" type="number" />
          </FormItem>
          <div className="grid grid-cols-2 gap-4">
            <FormItem label="付款方" field="payer" rules={[{ required: true, message: "请输入付款方" }]}>
              <Input placeholder="付款方名称" />
            </FormItem>
            <FormItem label="收款方" field="payee" rules={[{ required: true, message: "请输入收款方" }]}>
              <Input placeholder="收款方名称" />
            </FormItem>
          </div>
          <FormItem label="付款方式" field="method" rules={[{ required: true, message: "请选择付款方式" }]}>
            <Select placeholder="选择付款方式" options={methodOptions} />
          </FormItem>
          {!paymentType && (
            <FormItem label="类型" field="type" rules={[{ required: true, message: "请选择类型" }]}>
              <Select placeholder="选择付款类型">
                {Object.entries(typeLabel).map(([key, label]) => (
                  <Select.Option key={key} value={key}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          )}
          <FormItem label="日期" field="date" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
          </FormItem>
          <FormItem label="备注" field="notes">
            <Input.TextArea placeholder="备注信息（可选）" rows={3} />
          </FormItem>
          <FormItem label="附件链接" field="attachment_url">
            <Input placeholder="附件URL（可选）" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
