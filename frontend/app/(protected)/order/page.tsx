"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Form,
  Message,
  Popconfirm,
  Spin,
  Empty,
  Typography,
  InputNumber,
  Pagination,
  DatePicker,
  Drawer,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconDelete,
  IconCheck,
  IconClose,
  IconArrowRight,
} from "@arco-design/web-react/icon";
import api from "@/lib/api";
import type { Order, OrderStatus, PaginatedList } from "@/types";

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const FormItem = Form.Item;

/** Status label & color */
const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  draft: { label: "草稿", color: "gray" },
  confirmed: { label: "已确认", color: "blue" },
  in_progress: { label: "进行中", color: "gold" },
  completed: { label: "已完成", color: "green" },
  cancelled: { label: "已取消", color: "red" },
};

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, { label }]) => ({
  label,
  value,
}));

/** Allowed status transitions */
const STATUS_TRANSITIONS: Record<OrderStatus, { status: OrderStatus; label: string; icon: React.ReactNode }[]> = {
  draft: [
    { status: "confirmed", label: "确认", icon: <IconCheck /> },
    { status: "cancelled", label: "取消", icon: <IconClose /> },
  ],
  confirmed: [
    { status: "in_progress", label: "开始执行", icon: <IconArrowRight /> },
    { status: "cancelled", label: "取消", icon: <IconClose /> },
  ],
  in_progress: [
    { status: "completed", label: "完成", icon: <IconCheck /> },
  ],
  completed: [],
  cancelled: [],
};

/** Format currency */
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "¥0.00";
  return `¥${Number(amount).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Build SWR key
  const queryParams = new URLSearchParams({
    page: String(currentPage),
    page_size: String(pageSize),
  });
  if (search) queryParams.set("search", search);
  if (statusFilter) queryParams.set("status", statusFilter);
  if (dateRange.length === 2) {
    queryParams.set("start_date", dateRange[0]);
    queryParams.set("end_date", dateRange[1]);
  }

  const swrKey = `/order?${queryParams.toString()}`;
  const { data, isLoading, mutate } = useSWR<PaginatedList<Order>>(swrKey);

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;

  // Open add/edit drawer
  const openDrawer = useCallback(
    (order?: Order) => {
      if (order) {
        setEditingOrder(order);
        form.setFieldsValue({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone || "",
          customer_email: order.customer_email || "",
          destination: order.destination,
          travel_start: order.travel_start,
          travel_end: order.travel_end,
          pax_count: order.pax_count,
          total_amount: order.total_amount,
          notes: order.notes || "",
        });
      } else {
        setEditingOrder(null);
        form.resetFields();
      }
      setDrawerVisible(true);
    },
    [form]
  );

  // Submit add/edit
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);

      const payload = {
        ...values,
        travel_start:
          typeof values.travel_start === "string"
            ? values.travel_start
            : values.travel_start?.format?.("YYYY-MM-DD") ?? values.travel_start,
        travel_end:
          typeof values.travel_end === "string"
            ? values.travel_end
            : values.travel_end?.format?.("YYYY-MM-DD") ?? values.travel_end,
      };

      if (editingOrder) {
        await api.put(`/order/${editingOrder.id}`, payload);
        Message.success("订单更新成功");
      } else {
        await api.post("/order", payload);
        Message.success("订单创建成功");
      }

      setDrawerVisible(false);
      form.resetFields();
      setEditingOrder(null);
      mutate();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        Message.error(axiosErr.response?.data?.detail || "操作失败");
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, editingOrder, mutate]);

  // Change order status
  const handleStatusChange = useCallback(
    async (orderId: number, newStatus: OrderStatus) => {
      try {
        await api.patch(`/order/${orderId}/status`, { status: newStatus });
        Message.success(`状态已更新为「${STATUS_MAP[newStatus].label}」`);
        mutate();
      } catch {
        Message.error("状态更新失败");
      }
    },
    [mutate]
  );

  // Delete order (only draft)
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/order/${id}`);
        Message.success("订单已删除");
        mutate();
      } catch {
        Message.error("删除失败");
      }
    },
    [mutate]
  );

  const columns = [
    {
      title: "订单号",
      dataIndex: "order_no",
      key: "order_no",
      width: 150,
      render: (v: string) => (
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
          {v}
        </span>
      ),
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 130,
      render: (name: string) => (
        <span className="font-medium">{name}</span>
      ),
    },
    {
      title: "目的地",
      dataIndex: "destination",
      key: "destination",
      width: 140,
      ellipsis: true,
    },
    {
      title: "出发日期",
      dataIndex: "travel_start",
      key: "travel_start",
      width: 120,
      render: (v: string) => v?.slice(0, 10) || "-",
    },
    {
      title: "人数",
      dataIndex: "pax_count",
      key: "pax_count",
      width: 80,
      render: (v: number) => `${v} 人`,
    },
    {
      title: "金额",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 130,
      render: (amount: number) => (
        <span className="font-medium text-amber-600 dark:text-amber-400">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: OrderStatus) => {
        const info = STATUS_MAP[status] || { label: status, color: "gray" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 280,
      fixed: "right" as const,
      render: (_: unknown, record: Order) => {
        const transitions = STATUS_TRANSITIONS[record.status] || [];
        return (
          <Space size={4} wrap>
            {/* Status flow buttons */}
            {transitions.map((t) => (
              <Popconfirm
                key={t.status}
                title={`确定要将订单状态改为「${t.label}」吗？`}
                onOk={() => handleStatusChange(record.id, t.status)}
              >
                <Button type="outline" size="mini">
                  {t.label}
                </Button>
              </Popconfirm>
            ))}

            {/* Edit */}
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              onClick={() => openDrawer(record)}
            />

            {/* Delete (only draft) */}
            {record.status === "draft" && (
              <Popconfirm
                title="确定要删除该订单吗？"
                onOk={() => handleDelete(record.id)}
              >
                <Button
                  type="text"
                  size="mini"
                  status="danger"
                  icon={<IconDelete />}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title heading={4} className="!mb-0 !text-gray-900 dark:!text-white">
          订单管理
        </Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => openDrawer()}>
          新建订单
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input
          allowClear
          placeholder="搜索订单号或客户..."
          prefix={<IconSearch />}
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          className="sm:!w-64"
        />
        <Select
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          options={STATUS_OPTIONS}
          className="sm:!w-36"
        />
        <RangePicker
          placeholder={["开始日期", "结束日期"]}
          onChange={(dateStrings) => {
            setDateRange(dateStrings || []);
            setCurrentPage(1);
          }}
          style={{ width: 260 }}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size={32} />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="暂无订单数据" />
      ) : (
        <>
          <Table
            columns={columns}
            data={orders}
            rowKey="id"
            border={false}
            stripe
            scroll={{ x: 1140 }}
            pagination={false}
            className="[&_.arco-table]:!bg-transparent"
          />
          <div className="flex justify-end">
            <Pagination
              total={total}
              current={currentPage}
              pageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              showTotal
              sizeCanChange={false}
            />
          </div>
        </>
      )}

      {/* Add / Edit Drawer */}
      <Drawer
        title={editingOrder ? "编辑订单" : "新建订单"}
        visible={drawerVisible}
        width={520}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => {
          setDrawerVisible(false);
          form.resetFields();
          setEditingOrder(null);
        }}
        autoFocus={false}
        focusLock
        footer={
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setDrawerVisible(false);
                form.resetFields();
                setEditingOrder(null);
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {editingOrder ? "保存" : "创建"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem
            label="客户名称"
            field="customer_name"
            rules={[{ required: true, message: "请输入客户名称" }]}
          >
            <Input placeholder="客户姓名" />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="客户手机" field="customer_phone">
              <Input placeholder="手机号码" />
            </FormItem>
            <FormItem label="客户邮箱" field="customer_email">
              <Input placeholder="邮箱地址" />
            </FormItem>
          </div>

          <FormItem
            label="目的地"
            field="destination"
            rules={[{ required: true, message: "请输入目的地" }]}
          >
            <Input placeholder="旅行目的地" />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="出发日期"
              field="travel_start"
              rules={[{ required: true, message: "请选择出发日期" }]}
            >
              <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
            </FormItem>
            <FormItem
              label="返回日期"
              field="travel_end"
              rules={[{ required: true, message: "请选择返回日期" }]}
            >
              <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="出行人数"
              field="pax_count"
              rules={[{ required: true, message: "请输入人数" }]}
            >
              <InputNumber min={1} placeholder="人数" style={{ width: "100%" }} />
            </FormItem>
            <FormItem
              label="订单金额"
              field="total_amount"
              rules={[{ required: true, message: "请输入金额" }]}
            >
              <InputNumber
                min={0}
                step={100}
                precision={2}
                prefix="¥"
                placeholder="总金额"
                style={{ width: "100%" }}
              />
            </FormItem>
          </div>

          <FormItem label="备注" field="notes">
            <TextArea
              placeholder="订单备注信息..."
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </FormItem>
        </Form>
      </Drawer>
    </div>
  );
}
