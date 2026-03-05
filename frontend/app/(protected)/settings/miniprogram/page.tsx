"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import api, { swrFetcher } from "@/lib/api";
import {
  Button,
  Input,
  Message,
  Form,
  Breadcrumb,
  Card,
  Spin,
} from "@arco-design/web-react";
import {
  IconSave,
  IconLock,
  IconEye,
  IconEyeInvisible,
} from "@arco-design/web-react/icon";
import Link from "next/link";

const FormItem = Form.Item;

interface MiniprogramConfig {
  app_id: string;
  app_secret: string;
  token: string;
}

export default function MiniprogramPage() {
  const [submitting, setSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [form] = Form.useForm();

  // Try to load existing config -- this is a placeholder endpoint
  // In a real app, GET /api/settings/miniprogram would return the config
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Attempt to load existing miniprogram config
    const loadConfig = async () => {
      try {
        const res = await api.get("/settings/miniprogram");
        if (res.data) {
          form.setFieldsValue(res.data);
        }
      } catch {
        // No config yet, start fresh
      } finally {
        setLoaded(true);
      }
    };
    loadConfig();
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      await api.put("/settings/miniprogram", values);
      Message.success("配置保存成功");
    } catch (err: any) {
      if (err?.response) {
        Message.error("保存失败");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href="/settings" className="text-brand hover:text-brand-dark">
            系统设置
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>小程序配置</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          小程序配置
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          配置微信小程序的开发参数，用于小程序接口对接
        </p>
      </div>

      {/* Config Form */}
      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <Spin size={32} />
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <Form form={form} layout="vertical">
              <FormItem
                label={
                  <span className="flex items-center gap-2">
                    AppID
                    <span className="text-xs text-gray-400 font-normal">
                      (小程序唯一标识)
                    </span>
                  </span>
                }
                field="app_id"
                rules={[{ required: true, message: "请输入 AppID" }]}
              >
                <Input placeholder="请输入微信小程序 AppID" />
              </FormItem>

              <FormItem
                label={
                  <span className="flex items-center gap-2">
                    AppSecret
                    <span className="text-xs text-gray-400 font-normal">
                      (小程序密钥)
                    </span>
                  </span>
                }
                field="app_secret"
                rules={[{ required: true, message: "请输入 AppSecret" }]}
              >
                <Input.Password
                  placeholder="请输入微信小程序 AppSecret"
                  visibilityToggle
                />
              </FormItem>

              <FormItem
                label={
                  <span className="flex items-center gap-2">
                    Token
                    <span className="text-xs text-gray-400 font-normal">
                      (消息校验令牌)
                    </span>
                  </span>
                }
                field="token"
              >
                <Input.Password
                  placeholder="请输入消息校验 Token（选填）"
                  visibilityToggle
                />
              </FormItem>

              {/* Security notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 mb-6">
                <IconLock className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  AppSecret 是小程序的核心密钥，请妥善保管。配置保存后将加密存储，不会明文展示。
                </p>
              </div>

              <Button
                type="primary"
                icon={<IconSave />}
                loading={submitting}
                onClick={handleSave}
                size="large"
              >
                保存配置
              </Button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
