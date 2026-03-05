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
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconEdit,
  IconDelete,
} from "@arco-design/web-react/icon";
import useSWR, { mutate } from "swr";
import api, { swrFetcher } from "@/lib/api";

const FormItem = Form.Item;

interface Insurance {
  id: number;
  policy_no: string;
  provider: string;
  type: string;
  coverage: string;
  premium: number;
  start_date: string;
  end_date: string;
  status: string;
  order_id?: string;
  notes?: string;
  created_at: string;
}

interface PaginatedResponse {
  items: Insurance[];
  total: number;
  page: number;
  page_size: number;
}

const statusColorMap: Record<string, string> = {
  active: "green",
  expired: "orangered",
  cancelled: "red",
};

const statusLabelMap: Record<string, string> = {
  active: "生效中",
  expired: "已过期",
  cancelled: "已取消",
};

const insuranceTypes = [
  { label: "旅游意外险", value: "travel_accident" },
  { label: "旅行社责任险", value: "agency_liability" },
  { label: "航班延误险", value: "flight_delay" },
  { label: "行李丢失险", value: "luggage_loss" },
  { label: "医疗保险", value: "medical" },
  { label: "综合保险", value: "comprehensive" },
  { label: "其他", value: "other" },
];

export default function InsurancePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return `/insurance?${params.toString()}`;
  }, [statusFilter, page, pageSize]);

  const { data, isLoading } = useSWR<PaginatedResponse>(swrKey, swrFetcher, {
    keepPreviousData: true,
  });

  const filteredItems = data?.items?.filter((item) =>
    searchText
      ? item.policy_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.provider?.toLowerCase().includes(searchText.toLowerCase())
      : true
  );

  const handleAdd = () => {
    setEditingInsurance(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Insurance) => {
    setEditingInsurance(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      if (editingInsurance) {
        await api.put(`/insurance/${editingInsurance.id}`, values);
        Message.success("保险已更新");
      } else {
        await api.post("/insurance", values);
        Message.success("保险已创建");
      }
      setModalVisible(false);
      mutate(swrKey);
    } catch {
      Message.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除此保险记录吗？",
      okButtonProps: { status: "danger" },
      onOk: async () => {
        try {
          await api.delete(`/insurance/${id}`);
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
      title: "保单号",
      dataIndex: "policy_no",
      width: 150,
      render: (val: string) => (
        <span className="font-medium text-brand-700 dark:text-brand-300">{val}</span>
      ),
    },
    {
      title: "供应商",
      dataIndex: "provider",
      width: 150,
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 130,
      render: (val: string) => {
        const found = insuranceTypes.find((t) => t.value === val);
        return found ? found.label : val;
      },
    },
    {
      title: "保额/范围",
      dataIndex: "coverage",
      width: 140,
    },
    {
      title: "保费(¥)",
      dataIndex: "premium",
      width: 120,
      render: (val: number) => (
        <span className="font-semibold text-brand-700 dark:text-brand-300">
          ¥{val?.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "起始日期",
      dataIndex: "start_date",
      width: 120,
    },
    {
      title: "截止日期",
      dataIndex: "end_date",
      width: 120,
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
      title: "操作",
      dataIndex: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, record: Insurance) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">保险管理</h1>
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
          新增保险
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索保单号/供应商..."
          value={searchText}
          onChange={setSearchText}
          allowClear
          style={{ width: 240 }}
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
          <Select.Option value="active">生效中</Select.Option>
          <Select.Option value="expired">已过期</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
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

      {/* Add/Edit Modal */}
      <Modal
        title={editingInsurance ? "编辑保险" : "新增保险"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText="提交"
        cancelText="取消"
        style={{ width: 560 }}
        unmountOnExit
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem
            label="保单号"
            field="policy_no"
            rules={[{ required: true, message: "请输入保单号" }]}
          >
            <Input placeholder="请输入保单号" />
          </FormItem>
          <FormItem
            label="保险供应商"
            field="provider"
            rules={[{ required: true, message: "请输入供应商" }]}
          >
            <Input placeholder="保险公司名称" />
          </FormItem>
          <FormItem
            label="保险类型"
            field="type"
            rules={[{ required: true, message: "请选择保险类型" }]}
          >
            <Select placeholder="选择保险类型" options={insuranceTypes} />
          </FormItem>
          <FormItem
            label="保额/覆盖范围"
            field="coverage"
            rules={[{ required: true, message: "请输入保额" }]}
          >
            <Input placeholder="如: 100万元/人" />
          </FormItem>
          <FormItem
            label="保费"
            field="premium"
            rules={[{ required: true, message: "请输入保费" }]}
          >
            <Input prefix="¥" placeholder="0.00" type="number" />
          </FormItem>
          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="起始日期"
              field="start_date"
              rules={[{ required: true, message: "请选择起始日期" }]}
            >
              <DatePicker placeholder="起始日期" style={{ width: "100%" }} />
            </FormItem>
            <FormItem
              label="截止日期"
              field="end_date"
              rules={[{ required: true, message: "请选择截止日期" }]}
            >
              <DatePicker placeholder="截止日期" style={{ width: "100%" }} />
            </FormItem>
          </div>
          <FormItem label="关联订单号" field="order_id">
            <Input placeholder="关联订单号（可选）" />
          </FormItem>
          <FormItem label="备注" field="notes">
            <Input.TextArea placeholder="备注信息（可选）" rows={3} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
