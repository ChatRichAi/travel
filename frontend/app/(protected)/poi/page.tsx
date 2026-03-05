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
} from "@arco-design/web-react";
import { IconPlus, IconSearch, IconEdit, IconDelete } from "@arco-design/web-react/icon";
import api from "@/lib/api";
import type { Poi, PoiType, PaginatedList } from "@/types";

const { Title } = Typography;
const { TextArea } = Input;
const FormItem = Form.Item;

/** POI type label & color */
const POI_TYPE_MAP: Record<PoiType, { label: string; color: string }> = {
  hotel: { label: "酒店", color: "blue" },
  restaurant: { label: "餐厅", color: "orange" },
  attraction: { label: "景点", color: "green" },
  transport: { label: "交通", color: "purple" },
};

const POI_TYPE_OPTIONS = Object.entries(POI_TYPE_MAP).map(([value, { label }]) => ({
  label,
  value,
}));

export default function PoiPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState<Poi | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Build SWR key
  const queryParams = new URLSearchParams({
    page: String(currentPage),
    page_size: String(pageSize),
  });
  if (search) queryParams.set("search", search);
  if (typeFilter) queryParams.set("type", typeFilter);

  const swrKey = `/poi?${queryParams.toString()}`;
  const { data, isLoading, mutate } = useSWR<PaginatedList<Poi>>(swrKey);

  const pois = data?.items ?? [];
  const total = data?.total ?? 0;

  // Open add/edit modal
  const openModal = useCallback(
    (poi?: Poi) => {
      if (poi) {
        setEditingPoi(poi);
        form.setFieldsValue({
          name: poi.name,
          type: poi.type,
          location: poi.location,
          description: poi.description || "",
          rating: poi.rating,
          price_range: poi.price_range || "",
          contact: poi.contact || "",
        });
      } else {
        setEditingPoi(null);
        form.resetFields();
      }
      setModalVisible(true);
    },
    [form]
  );

  // Submit add/edit
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);

      if (editingPoi) {
        await api.put(`/poi/${editingPoi.id}`, values);
        Message.success("更新成功");
      } else {
        await api.post("/poi", values);
        Message.success("创建成功");
      }

      setModalVisible(false);
      form.resetFields();
      setEditingPoi(null);
      mutate();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        Message.error(axiosErr.response?.data?.detail || "操作失败");
      }
      // form validation error - ignore
    } finally {
      setSubmitting(false);
    }
  }, [form, editingPoi, mutate]);

  // Delete POI
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await api.delete(`/poi/${id}`);
        Message.success("删除成功");
        mutate();
      } catch {
        Message.error("删除失败");
      }
    },
    [mutate]
  );

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{name}</span>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: PoiType) => {
        const info = POI_TYPE_MAP[type] || { label: type, color: "gray" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "位置",
      dataIndex: "location",
      key: "location",
      width: 200,
      ellipsis: true,
    },
    {
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      render: (rating: number | null) => {
        if (rating == null) return <span className="text-gray-400">-</span>;
        const stars = "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
        return (
          <span className="text-amber-500" title={`${rating} / 5`}>
            {stars}
          </span>
        );
      },
    },
    {
      title: "价格范围",
      dataIndex: "price_range",
      key: "price_range",
      width: 120,
      render: (v: string | null) => v || <span className="text-gray-400">-</span>,
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
      fixed: "right" as const,
      render: (_: unknown, record: Poi) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该 POI 吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" status="danger" icon={<IconDelete />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title heading={4} className="!mb-0 !text-gray-900 dark:!text-white">
          POI 景点
        </Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => openModal()}>
          新增
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          allowClear
          placeholder="搜索名称或位置..."
          prefix={<IconSearch />}
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          className="sm:!w-72"
        />
        <Select
          placeholder="类型筛选"
          allowClear
          value={typeFilter}
          onChange={(val) => {
            setTypeFilter(val);
            setCurrentPage(1);
          }}
          options={POI_TYPE_OPTIONS}
          className="sm:!w-40"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size={32} />
        </div>
      ) : pois.length === 0 ? (
        <Empty description="暂无 POI 数据" />
      ) : (
        <>
          <Table
            columns={columns}
            data={pois}
            rowKey="id"
            border={false}
            stripe
            scroll={{ x: 940 }}
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

      {/* Add / Edit Modal */}
      <Modal
        title={editingPoi ? "编辑 POI" : "新增 POI"}
        visible={modalVisible}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPoi(null);
        }}
        autoFocus={false}
        focusLock
        style={{ maxWidth: 560 }}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem
            label="名称"
            field="name"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="景点名称" />
          </FormItem>

          <FormItem
            label="类型"
            field="type"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select options={POI_TYPE_OPTIONS} placeholder="选择类型" />
          </FormItem>

          <FormItem
            label="位置"
            field="location"
            rules={[{ required: true, message: "请输入位置" }]}
          >
            <Input placeholder="详细地址或城市" />
          </FormItem>

          <FormItem label="描述" field="description">
            <TextArea placeholder="景点描述..." autoSize={{ minRows: 2, maxRows: 5 }} />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="评分" field="rating">
              <InputNumber
                min={0}
                max={5}
                step={0.1}
                precision={1}
                placeholder="0-5"
              />
            </FormItem>

            <FormItem label="价格范围" field="price_range">
              <Input placeholder="如: ¥500-1000" />
            </FormItem>
          </div>

          <FormItem label="联系方式" field="contact">
            <Input placeholder="电话或邮箱" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
