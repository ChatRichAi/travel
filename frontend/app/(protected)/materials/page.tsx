"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import api, { swrFetcher } from "@/lib/api";
import {
  Button,
  Input,
  Modal,
  Message,
  Tag,
  Pagination,
  Upload,
  Spin,
  Empty,
  Popconfirm,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconDelete,
  IconFile,
  IconImage,
  IconVideoCamera,
  IconFileAudio,
} from "@arco-design/web-react/icon";
import type { UploadItem } from "@arco-design/web-react/es/Upload";

interface Material {
  id: number;
  name: string;
  type: string; // image | video | document | template
  category: string;
  file_url: string;
  file_size: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MaterialsResponse {
  items: Material[];
  total: number;
  page: number;
  page_size: number;
}

const TYPE_TABS = [
  { key: "", label: "全部" },
  { key: "image", label: "图片" },
  { key: "video", label: "视频" },
  { key: "document", label: "文档" },
  { key: "template", label: "模板" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getTypeIcon(type: string) {
  switch (type) {
    case "image":
      return <IconImage className="text-green-500" />;
    case "video":
      return <IconVideoCamera className="text-blue-500" />;
    case "document":
      return <IconFile className="text-orange-500" />;
    case "template":
      return <IconFileAudio className="text-purple-500" />;
    default:
      return <IconFile className="text-gray-400" />;
  }
}

function getTypeTagColor(type: string): string {
  switch (type) {
    case "image":
      return "green";
    case "video":
      return "blue";
    case "document":
      return "orange";
    case "template":
      return "purple";
    default:
      return "gray";
  }
}

const typeLabels: Record<string, string> = {
  image: "图片",
  video: "视频",
  document: "文档",
  template: "模板",
};

export default function MaterialsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const queryStr = new URLSearchParams({
    ...(search && { search }),
    ...(typeFilter && { type: typeFilter }),
    page: String(page),
    page_size: String(pageSize),
  }).toString();

  const { data, isLoading, mutate } = useSWR<MaterialsResponse>(
    `/materials?${queryStr}`,
    swrFetcher
  );

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((key: string) => {
    setTypeFilter(key);
    setPage(1);
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/materials/${id}`);
      Message.success("删除成功");
      mutate();
    } catch {
      Message.error("删除失败");
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/materials/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Message.success("上传成功");
      setUploadVisible(false);
      mutate();
    } catch {
      Message.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const materials = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          素材库
        </h1>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={() => setUploadVisible(true)}
        >
          上传素材
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Type tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTypeChange(tab.key)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  typeFilter === tab.key
                    ? "bg-white dark:bg-gray-700 text-brand-dark dark:text-brand-light shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <Input.Search
          placeholder="搜索素材..."
          style={{ width: 280 }}
          onSearch={handleSearch}
          onChange={(val) => {
            if (!val) handleSearch("");
          }}
          allowClear
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size={32} />
        </div>
      ) : materials.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Empty description="暂无素材" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {materials.map((item) => (
            <div
              key={item.id}
              className="
                group relative rounded-xl border border-gray-200 dark:border-gray-700
                bg-white dark:bg-gray-800/60
                overflow-hidden hover:shadow-lg hover:border-brand/30
                transition-all duration-200
              "
            >
              {/* Thumbnail / Icon */}
              <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {item.thumbnail_url || item.type === "image" ? (
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl opacity-50">
                    {getTypeIcon(item.type)}
                  </span>
                )}

                {/* Type overlay badge */}
                <div className="absolute top-2 left-2">
                  <Tag size="small" color={getTypeTagColor(item.type)}>
                    {typeLabels[item.type] || item.type}
                  </Tag>
                </div>

                {/* Delete action overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Popconfirm
                    title="确定删除该素材?"
                    onOk={() => handleDelete(item.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      size="mini"
                      shape="circle"
                      status="danger"
                      icon={<IconDelete />}
                    />
                  </Popconfirm>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatFileSize(item.file_size)}</span>
                  <span>
                    {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex justify-center pt-4">
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={setPage}
            showTotal
          />
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        title="上传素材"
        visible={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        footer={null}
        unmountOnExit
      >
        <div className="space-y-4">
          <Upload
            drag
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            autoUpload={false}
            onChange={(fileList: UploadItem[]) => {
              const file = fileList[fileList.length - 1];
              if (file?.originFile) {
                handleUpload(file.originFile);
              }
            }}
            tip="支持图片、视频、文档格式，拖拽文件到此区域上传"
            disabled={uploading}
          />
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Spin size={16} />
              <span>上传中...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
