"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import api, { swrFetcher } from "@/lib/api";
import {
  Button,
  Input,
  Modal,
  Drawer,
  Message,
  Tag,
  Pagination,
  Select,
  Spin,
  Empty,
  Popconfirm,
  Form,
  Table,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconSend,
  IconEye,
} from "@arco-design/web-react/icon";

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface WechatArticle {
  id: number;
  title: string;
  content: string;
  cover_image: string | null;
  status: "draft" | "published";
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ArticlesResponse {
  items: WechatArticle[];
  total: number;
  page: number;
  page_size: number;
}

const STATUS_FILTERS = [
  { key: "", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "published", label: "已发布" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "orange" },
  published: { label: "已发布", color: "green" },
};

export default function WechatArticlesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<WechatArticle | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const queryStr = new URLSearchParams({
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    page: String(page),
    page_size: String(pageSize),
  }).toString();

  const { data, isLoading, mutate } = useSWR<ArticlesResponse>(
    `/wechat?${queryStr}`,
    swrFetcher
  );

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((key: string) => {
    setStatusFilter(key);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditingArticle(null);
    form.resetFields();
    form.setFieldsValue({ status: "draft" });
    setDrawerVisible(true);
  };

  const openEdit = (article: WechatArticle) => {
    setEditingArticle(article);
    form.setFieldsValue({
      title: article.title,
      content: article.content,
      cover_image: article.cover_image || "",
      status: article.status,
    });
    setDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      if (editingArticle) {
        await api.put(`/wechat/${editingArticle.id}`, values);
        Message.success("文章更新成功");
      } else {
        await api.post("/wechat", values);
        Message.success("文章创建成功");
      }
      setDrawerVisible(false);
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
      await api.delete(`/wechat/${id}`);
      Message.success("删除成功");
      mutate();
    } catch {
      Message.error("删除失败");
    }
  };

  const handlePublish = async (article: WechatArticle) => {
    try {
      await api.put(`/wechat/${article.id}`, { status: "published" });
      Message.success("发布成功");
      mutate();
    } catch {
      Message.error("发布失败");
    }
  };

  const articles = data?.items || [];
  const total = data?.total || 0;

  const columns = [
    {
      title: "封面",
      dataIndex: "cover_image",
      width: 80,
      render: (url: string | null) =>
        url ? (
          <img
            src={url}
            alt=""
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
            无
          </div>
        ),
    },
    {
      title: "标题",
      dataIndex: "title",
      render: (title: string) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {title}
        </span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status] || {
          label: status,
          color: "gray",
        };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "作者",
      dataIndex: "author",
      width: 120,
    },
    {
      title: "发布时间",
      dataIndex: "published_at",
      width: 160,
      render: (val: string | null) =>
        val
          ? new Date(val).toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 160,
      render: (val: string) =>
        new Date(val).toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "操作",
      width: 200,
      render: (_: unknown, record: WechatArticle) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          {record.status === "draft" && (
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconSend />}
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
          )}
          <Popconfirm
            title="确定删除该文章?"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          微信文章
        </h1>
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新建文章
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  statusFilter === tab.key
                    ? "bg-white dark:bg-gray-700 text-brand-dark dark:text-brand-light shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Input.Search
          placeholder="搜索文章..."
          style={{ width: 280 }}
          onSearch={handleSearch}
          onChange={(val) => {
            if (!val) handleSearch("");
          }}
          allowClear
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table
          columns={columns}
          data={articles}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          noDataElement={<Empty description="暂无文章" />}
          scroll={{ x: 900 }}
        />
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={setPage}
            showTotal
          />
        </div>
      )}

      {/* Add/Edit Drawer */}
      <Drawer
        width={560}
        title={editingArticle ? "编辑文章" : "新建文章"}
        visible={drawerVisible}
        onCancel={() => {
          setDrawerVisible(false);
          form.resetFields();
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setDrawerVisible(false);
                form.resetFields();
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {editingArticle ? "保存" : "创建"}
            </Button>
          </div>
        }
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="标题"
            field="title"
            rules={[{ required: true, message: "请输入文章标题" }]}
          >
            <Input placeholder="请输入文章标题" />
          </FormItem>

          <FormItem
            label="内容"
            field="content"
            rules={[{ required: true, message: "请输入文章内容" }]}
          >
            <TextArea
              placeholder="请输入文章内容..."
              autoSize={{ minRows: 10, maxRows: 20 }}
            />
          </FormItem>

          <FormItem label="封面图 URL" field="cover_image">
            <Input placeholder="请输入封面图片链接" />
          </FormItem>

          <FormItem label="状态" field="status">
            <Select
              options={[
                { label: "草稿", value: "draft" },
                { label: "已发布", value: "published" },
              ]}
            />
          </FormItem>
        </Form>
      </Drawer>
    </div>
  );
}
