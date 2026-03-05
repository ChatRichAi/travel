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
  Drawer,
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

interface Contract {
  id: number;
  contract_no: string;
  subject: string;
  type: string;
  parties: string;
  amount: number;
  status: string;
  sign_date: string;
  expire_date: string;
  file_url?: string;
  notes?: string;
  created_at: string;
}

interface PaginatedResponse {
  items: Contract[];
  total: number;
  page: number;
  page_size: number;
}

const statusColorMap: Record<string, string> = {
  draft: "gray",
  signed: "green",
  expired: "red",
  cancelled: "gray",
};

const statusLabelMap: Record<string, string> = {
  draft: "草稿",
  signed: "已签署",
  expired: "已过期",
  cancelled: "已取消",
};

const contractTypes = [
  { label: "旅游服务合同", value: "service" },
  { label: "供应商合同", value: "supplier" },
  { label: "代理合同", value: "agent" },
  { label: "租赁合同", value: "lease" },
  { label: "劳务合同", value: "labor" },
  { label: "其他", value: "other" },
];

export default function ContractPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return `/contract?${params.toString()}`;
  }, [statusFilter, page, pageSize]);

  const { data, isLoading } = useSWR<PaginatedResponse>(swrKey, swrFetcher, {
    keepPreviousData: true,
  });

  const filteredItems = data?.items?.filter((item) =>
    searchText
      ? item.contract_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.parties?.toLowerCase().includes(searchText.toLowerCase())
      : true
  );

  const handleAdd = () => {
    setEditingContract(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: Contract) => {
    setEditingContract(record);
    form.setFieldsValue(record);
    setDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      if (editingContract) {
        await api.put(`/contract/${editingContract.id}`, values);
        Message.success("合同已更新");
      } else {
        await api.post("/contract", values);
        Message.success("合同已创建");
      }
      setDrawerVisible(false);
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
      content: "确定要删除此合同吗？此操作不可恢复。",
      okButtonProps: { status: "danger" },
      onOk: async () => {
        try {
          await api.delete(`/contract/${id}`);
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
      title: "合同号",
      dataIndex: "contract_no",
      width: 150,
      render: (val: string) => (
        <span className="font-medium text-brand-700 dark:text-brand-300">{val}</span>
      ),
    },
    {
      title: "主体",
      dataIndex: "subject",
      width: 180,
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 120,
      render: (val: string) => {
        const found = contractTypes.find((t) => t.value === val);
        return found ? found.label : val;
      },
    },
    {
      title: "签约方",
      dataIndex: "parties",
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
      title: "签署日期",
      dataIndex: "sign_date",
      width: 120,
    },
    {
      title: "到期日期",
      dataIndex: "expire_date",
      width: 120,
    },
    {
      title: "操作",
      dataIndex: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, record: Contract) => (
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">合同管理</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {data?.total ?? 0} 份合同
          </p>
        </div>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={handleAdd}
          className="!bg-brand !border-brand hover:!bg-brand-dark"
        >
          新增合同
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索合同号/主体/签约方..."
          value={searchText}
          onChange={setSearchText}
          allowClear
          style={{ width: 280 }}
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
          <Select.Option value="signed">已签署</Select.Option>
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
          scroll={{ x: 1300 }}
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

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingContract ? "编辑合同" : "新增合同"}
        visible={drawerVisible}
        width={520}
        onCancel={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              className="!bg-brand !border-brand hover:!bg-brand-dark"
            >
              提交
            </Button>
          </div>
        }
        unmountOnExit
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <FormItem
            label="合同号"
            field="contract_no"
            rules={[{ required: true, message: "请输入合同号" }]}
          >
            <Input placeholder="请输入合同号" />
          </FormItem>
          <FormItem
            label="合同主体"
            field="subject"
            rules={[{ required: true, message: "请输入合同主体" }]}
          >
            <Input placeholder="合同主体/名称" />
          </FormItem>
          <FormItem
            label="合同类型"
            field="type"
            rules={[{ required: true, message: "请选择合同类型" }]}
          >
            <Select placeholder="选择合同类型" options={contractTypes} />
          </FormItem>
          <FormItem
            label="签约方"
            field="parties"
            rules={[{ required: true, message: "请输入签约方" }]}
          >
            <Input placeholder="签约各方名称" />
          </FormItem>
          <FormItem
            label="金额"
            field="amount"
            rules={[{ required: true, message: "请输入金额" }]}
          >
            <Input prefix="¥" placeholder="0.00" type="number" />
          </FormItem>
          <div className="grid grid-cols-2 gap-4">
            <FormItem
              label="签署日期"
              field="sign_date"
              rules={[{ required: true, message: "请选择签署日期" }]}
            >
              <DatePicker placeholder="签署日期" style={{ width: "100%" }} />
            </FormItem>
            <FormItem
              label="到期日期"
              field="expire_date"
              rules={[{ required: true, message: "请选择到期日期" }]}
            >
              <DatePicker placeholder="到期日期" style={{ width: "100%" }} />
            </FormItem>
          </div>
          <FormItem label="状态" field="status" initialValue="draft">
            <Select placeholder="合同状态">
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="signed">已签署</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </FormItem>
          <FormItem label="合同文件链接" field="file_url">
            <Input placeholder="合同文件URL（可选）" />
          </FormItem>
          <FormItem label="备注" field="notes">
            <Input.TextArea placeholder="备注信息（可选）" rows={3} />
          </FormItem>
        </Form>
      </Drawer>
    </div>
  );
}
