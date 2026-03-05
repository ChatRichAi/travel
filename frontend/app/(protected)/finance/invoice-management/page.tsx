"use client";

import { useState } from "react";
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
import { IconPlus, IconSearch, IconFilter, IconEdit, IconDelete } from "@arco-design/web-react/icon";
import useSWR, { mutate } from "swr";
import api, { swrFetcher } from "@/lib/api";

const FormItem = Form.Item;

interface Invoice {
  id: number;
  invoice_no: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  buyer: string;
  seller: string;
  notes?: string;
  created_at: string;
}

interface PaginatedResponse {
  items: Invoice[];
  total: number;
  page: number;
  page_size: number;
}

const statusColorMap: Record<string, string> = {
  draft: "gray",
  issued: "arcoblue",
  paid: "green",
  cancelled: "red",
  overdue: "orangered",
};

const statusLabelMap: Record<string, string> = {
  draft: "草稿",
  issued: "已开具",
  paid: "已付款",
  cancelled: "已作废",
  overdue: "逾期",
};

const invoiceTypes = [
  { label: "增值税普通发票", value: "normal" },
  { label: "增值税专用发票", value: "special" },
  { label: "电子发票", value: "electronic" },
  { label: "收据", value: "receipt" },
];

export default function InvoiceManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const params = new URLSearchParams();
  if (statusFilter) params.set("status", statusFilter);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  const swrKey = `/finance/invoices?${params.toString()}`;

  const { data, isLoading } = useSWR<PaginatedResponse>(swrKey, swrFetcher, {
    keepPreviousData: true,
  });

  const filteredItems = data?.items?.filter((item) =>
    searchText ? item.invoice_no?.toLowerCase().includes(searchText.toLowerCase()) : true
  );

  const handleAdd = () => {
    setEditingInvoice(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Invoice) => {
    setEditingInvoice(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      if (editingInvoice) {
        await api.put(`/finance/invoices/${editingInvoice.id}`, values);
        Message.success("发票已更新");
      } else {
        await api.post("/finance/invoices", values);
        Message.success("发票已创建");
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
      content: "确定要删除此发票记录吗？",
      okButtonProps: { status: "danger" },
      onOk: async () => {
        try {
          await api.delete(`/finance/invoices/${id}`);
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
      title: "发票号",
      dataIndex: "invoice_no",
      width: 160,
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
      title: "类型",
      dataIndex: "type",
      width: 150,
      render: (val: string) => {
        const found = invoiceTypes.find((t) => t.value === val);
        return found ? found.label : val;
      },
    },
    {
      title: "购方",
      dataIndex: "buyer",
      width: 140,
    },
    {
      title: "销方",
      dataIndex: "seller",
      width: 140,
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
      title: "操作",
      dataIndex: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, record: Invoice) => (
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">发票管理</h1>
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
          新增发票
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索发票号..."
          value={searchText}
          onChange={setSearchText}
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
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="issued">已开具</Select.Option>
          <Select.Option value="paid">已付款</Select.Option>
          <Select.Option value="cancelled">已作废</Select.Option>
          <Select.Option value="overdue">逾期</Select.Option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={filteredItems || []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1100 }}
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
        title={editingInvoice ? "编辑发票" : "新增发票"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
        okText="提交"
        cancelText="取消"
        unmountOnExit
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem
            label="发票号"
            field="invoice_no"
            rules={[{ required: true, message: "请输入发票号" }]}
          >
            <Input placeholder="请输入发票号" />
          </FormItem>
          <FormItem
            label="金额"
            field="amount"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <Input prefix="¥" placeholder="0.00" type="number" />
          </FormItem>
          <FormItem
            label="类型"
            field="type"
            rules={[{ required: true, message: "请选择发票类型" }]}
          >
            <Select placeholder="选择发票类型" options={invoiceTypes} />
          </FormItem>
          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="购方"
              field="buyer"
              rules={[{ required: true, message: "请输入购方" }]}
            >
              <Input placeholder="购方名称" />
            </FormItem>
            <FormItem
              label="销方"
              field="seller"
              rules={[{ required: true, message: "请输入销方" }]}
            >
              <Input placeholder="销方名称" />
            </FormItem>
          </div>
          <FormItem label="日期" field="date" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker placeholder="选择日期" style={{ width: "100%" }} />
          </FormItem>
          <FormItem label="备注" field="notes">
            <Input.TextArea placeholder="备注信息（可选）" rows={3} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
