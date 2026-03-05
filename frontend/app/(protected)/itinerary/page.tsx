"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Table,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Form,
  Message,
  Spin,
  Empty,
  Typography,
  Input,
  Pagination,
  DatePicker,
} from "@arco-design/web-react";
import { IconPlus, IconEye } from "@arco-design/web-react/icon";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Itinerary, OrderStatus, PaginatedList } from "@/types";

const { Title, Text } = Typography;
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

/** Calculate number of days between two dates */
function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

export default function ItineraryPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>([]);
  const [form] = Form.useForm();

  // Build SWR key
  const queryParams = new URLSearchParams({
    page: String(currentPage),
    page_size: String(pageSize),
  });
  if (statusFilter) queryParams.set("status", statusFilter);

  const swrKey = `/itinerary?${queryParams.toString()}`;
  const { data, isLoading, mutate } = useSWR<PaginatedList<Itinerary>>(swrKey);

  const itineraries = data?.items ?? [];
  const total = data?.total ?? 0;

  // Create itinerary
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);

      const payload = {
        title: values.title,
        start_date:
          typeof values.start_date === "string"
            ? values.start_date
            : values.start_date?.format?.("YYYY-MM-DD") ?? values.start_date,
        end_date:
          typeof values.end_date === "string"
            ? values.end_date
            : values.end_date?.format?.("YYYY-MM-DD") ?? values.end_date,
      };

      await api.post("/itinerary", payload);
      Message.success("行程创建成功");
      setModalVisible(false);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        Message.error(axiosErr.response?.data?.detail || "创建失败");
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, mutate]);

  // Expand row to show days
  const handleExpandRow = useCallback(
    (record: Itinerary) => {
      const key = record.id;
      if (expandedRowKeys.includes(key)) {
        setExpandedRowKeys(expandedRowKeys.filter((k) => k !== key));
      } else {
        setExpandedRowKeys([...expandedRowKeys, key]);
      }
    },
    [expandedRowKeys]
  );

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 220,
      render: (title: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
      ),
    },
    {
      title: "开始日期",
      dataIndex: "start_date",
      key: "start_date",
      width: 130,
      render: (v: string) => v?.slice(0, 10) || "-",
    },
    {
      title: "结束日期",
      dataIndex: "end_date",
      key: "end_date",
      width: 130,
      render: (v: string) => v?.slice(0, 10) || "-",
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
      title: "天数",
      key: "days_count",
      width: 80,
      render: (_: unknown, record: Itinerary) => {
        if (!record.start_date || !record.end_date) return "-";
        return `${daysBetween(record.start_date, record.end_date)} 天`;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 100,
      render: (_: unknown, record: Itinerary) => (
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => router.push(`/itinerary/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  // Expand row render
  const expandedRowRender = (record: Itinerary) => {
    const days = record.days ?? [];
    if (days.length === 0) {
      return (
        <div className="py-4 px-6 text-gray-400 text-sm">
          暂无行程安排，点击编辑添加每日行程
        </div>
      );
    }

    return (
      <div className="py-3 px-2 space-y-4">
        {days
          .sort((a, b) => a.day_number - b.day_number)
          .map((day) => (
            <div
              key={day.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Tag color="arcoblue" size="small">
                  第 {day.day_number} 天
                </Tag>
                <Text className="text-sm text-gray-500">{day.date?.slice(0, 10)}</Text>
                {day.title && (
                  <Text className="text-sm font-medium">{day.title}</Text>
                )}
              </div>

              {day.items && day.items.length > 0 ? (
                <div className="space-y-2 ml-2">
                  {day.items
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        {item.time_start && (
                          <span className="text-gray-400 font-mono whitespace-nowrap min-w-[50px]">
                            {item.time_start}
                          </span>
                        )}
                        <div>
                          {item.description && (
                            <p className="text-gray-400 text-xs mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <Text className="text-xs text-gray-400">暂无安排</Text>
              )}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title heading={4} className="!mb-0 !text-gray-900 dark:!text-white">
          行程管理
        </Title>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={() => {
            form.resetFields();
            setModalVisible(true);
          }}
        >
          新建行程
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          options={STATUS_OPTIONS}
          className="sm:!w-40"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size={32} />
        </div>
      ) : itineraries.length === 0 ? (
        <Empty description="暂无行程数据" />
      ) : (
        <>
          <Table
            columns={columns}
            data={itineraries}
            rowKey="id"
            border={false}
            stripe
            scroll={{ x: 760 }}
            pagination={false}
            expandedRowRender={expandedRowRender}
            expandedRowKeys={expandedRowKeys}
            onExpand={(_, record) => handleExpandRow(record as unknown as Itinerary)}
            expandProps={{
              icon: () => null,
              width: 0,
            }}
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

      {/* Create Modal */}
      <Modal
        title="新建行程"
        visible={modalVisible}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        autoFocus={false}
        focusLock
        style={{ maxWidth: 480 }}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem
            label="标题"
            field="title"
            rules={[{ required: true, message: "请输入行程标题" }]}
          >
            <Input placeholder="如: 马尔代夫7日蜜月行" />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="开始日期"
              field="start_date"
              rules={[{ required: true, message: "请选择开始日期" }]}
            >
              <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
            </FormItem>

            <FormItem
              label="结束日期"
              field="end_date"
              rules={[{ required: true, message: "请选择结束日期" }]}
            >
              <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
            </FormItem>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
