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
  Select,
  Switch,
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

interface PaymentMethod {
  id: number;
  name: string;
  type: string; // bank | alipay | wechat
  account: string;
  bank_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  bank: { label: "银行", color: "blue" },
  alipay: { label: "支付宝", color: "arcoblue" },
  wechat: { label: "微信", color: "green" },
};

const typeOptions = [
  { label: "银行", value: "bank" },
  { label: "支付宝", value: "alipay" },
  { label: "微信", value: "wechat" },
];

export default function PaymentMethodsPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [form] = Form.useForm();

  const { data, isLoading, mutate } = useSWR<PaymentMethod[]>(
    "/settings/payment-methods",
    swrFetcher
  );

  const items = data || [];

  const openCreate = () => {
    setEditingItem(null);
    setSelectedType("");
    form.resetFields();
    form.setFieldsValue({ is_active: true, type: "bank" });
    setSelectedType("bank");
    setModalVisible(true);
  };

  const openEdit = (item: PaymentMethod) => {
    setEditingItem(item);
    setSelectedType(item.type);
    form.setFieldsValue({
      name: item.name,
      type: item.type,
      account: item.account,
      bank_name: item.bank_name || "",
      is_active: item.is_active,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/settings/payment-methods/${editingItem.id}`, values);
        Message.success("更新成功");
      } else {
        await api.post("/settings/payment-methods", values);
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
      await api.delete(`/settings/payment-methods/${id}`);
      Message.success("删除成功");
      mutate();
    } catch {
      Message.error("删除失败");
    }
  };

  const handleToggleActive = async (item: PaymentMethod) => {
    try {
      await api.put(`/settings/payment-methods/${item.id}`, {
        is_active: !item.is_active,
      });
      Message.success(item.is_active ? "已停用" : "已启用");
      mutate();
    } catch {
      Message.error("操作失败");
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      render: (name: string) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {name}
        </span>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 100,
      render: (type: string) => {
        const cfg = typeConfig[type] || { label: type, color: "gray" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "账号",
      dataIndex: "account",
      ellipsis: true,
    },
    {
      title: "银行名称",
      dataIndex: "bank_name",
      width: 160,
      render: (val: string | null) => val || "-",
    },
    {
      title: "状态",
      dataIndex: "is_active",
      width: 100,
      render: (active: boolean, record: PaymentMethod) => (
        <Switch
          size="small"
          checked={active}
          onChange={() => handleToggleActive(record)}
          checkedText="启用"
          uncheckedText="停用"
        />
      ),
    },
    {
      title: "操作",
      width: 160,
      render: (_: unknown, record: PaymentMethod) => (
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
            title="确定删除该付款方式?"
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
        <Breadcrumb.Item>付款方式管理</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          付款方式管理
        </h1>
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新增方式
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={items}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          noDataElement={<Empty description="暂无付款方式" />}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? "编辑付款方式" : "新增付款方式"}
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
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if (changedValues.type !== undefined) {
              setSelectedType(changedValues.type);
            }
          }}
        >
          <FormItem
            label="名称"
            field="name"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入付款方式名称" />
          </FormItem>

          <FormItem
            label="类型"
            field="type"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select
              placeholder="请选择付款类型"
              options={typeOptions}
            />
          </FormItem>

          <FormItem
            label="账号"
            field="account"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input placeholder="请输入账号信息" />
          </FormItem>

          {selectedType === "bank" && (
            <FormItem label="银行名称" field="bank_name">
              <Input placeholder="请输入银行名称（如：中国银行）" />
            </FormItem>
          )}

          <FormItem label="状态" field="is_active" triggerPropName="checked">
            <Switch checkedText="启用" uncheckedText="停用" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
