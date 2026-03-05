"use client";

import { useState } from "react";
import useSWR from "swr";
import api, { swrFetcher } from "@/lib/api";
import {
  Button,
  Input,
  Modal,
  Message,
  Tag,
  Table,
  Form,
  Empty,
  Popconfirm,
  Breadcrumb,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconEdit,
  IconDelete,
} from "@arco-design/web-react/icon";
import Link from "next/link";

const FormItem = Form.Item;

interface DealTag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const PRESET_COLORS = [
  "#c3b07d", // brand gold
  "#f53f3f", // red
  "#ff7d00", // orange
  "#ffb400", // yellow
  "#00b42a", // green
  "#3491fa", // blue
  "#722ed1", // purple
  "#f77eb9", // pink
  "#165dff", // indigo
  "#14c9c9", // teal
  "#86909c", // gray
  "#0fc6c2", // cyan
];

export default function OrderInfoPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DealTag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#c3b07d");
  const [form] = Form.useForm();

  const { data, isLoading, mutate } = useSWR<DealTag[]>(
    "/settings/deal-tags",
    swrFetcher
  );

  const items = data || [];

  const openCreate = () => {
    setEditingItem(null);
    setSelectedColor("#c3b07d");
    form.resetFields();
    form.setFieldsValue({ color: "#c3b07d" });
    setModalVisible(true);
  };

  const openEdit = (item: DealTag) => {
    setEditingItem(item);
    setSelectedColor(item.color);
    form.setFieldsValue({
      name: item.name,
      color: item.color,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/settings/deal-tags/${editingItem.id}`, values);
        Message.success("更新成功");
      } else {
        await api.post("/settings/deal-tags", values);
        Message.success("创建成功");
      }
      setModalVisible(false);
      form.resetFields();
      mutate();
    } catch (err: any) {
      if (err?.response) {
        Message.error("操作失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/settings/deal-tags/${id}`);
      Message.success("删除成功");
      mutate();
    } catch {
      Message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "标签名",
      dataIndex: "name",
      render: (name: string, record: DealTag) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: record.color }}
          />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {name}
          </span>
        </div>
      ),
    },
    {
      title: "颜色",
      dataIndex: "color",
      width: 160,
      render: (color: string) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600"
            style={{ backgroundColor: color }}
          />
          <code className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {color}
          </code>
        </div>
      ),
    },
    {
      title: "预览",
      width: 120,
      render: (_: unknown, record: DealTag) => (
        <span
          className="inline-block px-2.5 py-1 rounded-md text-xs font-medium text-white"
          style={{ backgroundColor: record.color }}
        >
          {record.name}
        </span>
      ),
    },
    {
      title: "操作",
      width: 160,
      render: (_: unknown, record: DealTag) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该标签?"
            onOk={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href="/settings" className="text-brand hover:text-brand-dark">
            系统设置
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>订单信息配置</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          订单信息配置
        </h1>
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新增标签
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        管理订单标签，用于标记和分类订单
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={items}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          noDataElement={<Empty description="暂无标签" />}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? "编辑标签" : "新增标签"}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingItem ? "保存" : "创建"}
        cancelText="取消"
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="标签名"
            field="name"
            rules={[{ required: true, message: "请输入标签名称" }]}
          >
            <Input placeholder="请输入标签名称" />
          </FormItem>

          <FormItem
            label="颜色"
            field="color"
            rules={[{ required: true, message: "请选择颜色" }]}
          >
            <div className="space-y-3">
              {/* Preset color palette */}
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      form.setFieldValue("color", color);
                    }}
                    className={`
                      w-8 h-8 rounded-lg cursor-pointer transition-all duration-150
                      ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-brand scale-110"
                          : "hover:scale-105"
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Custom color input */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    form.setFieldValue("color", e.target.value);
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                />
                <Input
                  value={selectedColor}
                  onChange={(val) => {
                    setSelectedColor(val);
                    form.setFieldValue("color", val);
                  }}
                  placeholder="#000000"
                  style={{ width: 120 }}
                />
                <span
                  className="inline-block px-3 py-1.5 rounded-md text-xs font-medium text-white"
                  style={{ backgroundColor: selectedColor }}
                >
                  预览
                </span>
              </div>
            </div>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
