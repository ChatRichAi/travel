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
  Switch,
  Empty,
  Popconfirm,
  Breadcrumb,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconLeft,
} from "@arco-design/web-react/icon";
import Link from "next/link";

const FormItem = Form.Item;

interface ContractSubject {
  id: number;
  name: string;
  code: string;
  address: string;
  contact: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContractSubjectPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ContractSubject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, mutate } = useSWR<ContractSubject[]>(
    "/settings/contract-subjects",
    swrFetcher
  );

  const items = data || [];

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalVisible(true);
  };

  const openEdit = (item: ContractSubject) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      code: item.code,
      address: item.address,
      contact: item.contact,
      is_active: item.is_active,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      if (editingItem) {
        await api.put(`/settings/contract-subjects/${editingItem.id}`, values);
        Message.success("更新成功");
      } else {
        await api.post("/settings/contract-subjects", values);
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
      await api.delete(`/settings/contract-subjects/${id}`);
      Message.success("删除成功");
      mutate();
    } catch {
      Message.error("删除失败");
    }
  };

  const handleToggleActive = async (item: ContractSubject) => {
    try {
      await api.put(`/settings/contract-subjects/${item.id}`, {
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
      title: "代码",
      dataIndex: "code",
      width: 120,
      render: (code: string) => (
        <code className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {code}
        </code>
      ),
    },
    {
      title: "地址",
      dataIndex: "address",
      ellipsis: true,
    },
    {
      title: "联系方式",
      dataIndex: "contact",
      width: 150,
    },
    {
      title: "状态",
      dataIndex: "is_active",
      width: 100,
      render: (active: boolean, record: ContractSubject) => (
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
      render: (_: unknown, record: ContractSubject) => (
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
            title="确定删除该合同主体?"
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
        <Breadcrumb.Item>合同主体管理</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          合同主体管理
        </h1>
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新增主体
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
          noDataElement={<Empty description="暂无合同主体" />}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? "编辑合同主体" : "新增合同主体"}
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
            label="名称"
            field="name"
            rules={[{ required: true, message: "请输入主体名称" }]}
          >
            <Input placeholder="请输入合同主体名称" />
          </FormItem>

          <FormItem
            label="代码"
            field="code"
            rules={[{ required: true, message: "请输入主体代码" }]}
          >
            <Input placeholder="请输入唯一标识代码" />
          </FormItem>

          <FormItem label="地址" field="address">
            <Input placeholder="请输入地址" />
          </FormItem>

          <FormItem label="联系方式" field="contact">
            <Input placeholder="请输入联系电话或邮箱" />
          </FormItem>

          <FormItem label="状态" field="is_active" triggerPropName="checked">
            <Switch checkedText="启用" uncheckedText="停用" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
