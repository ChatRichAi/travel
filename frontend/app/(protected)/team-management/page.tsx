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
  Spin,
  Empty,
  Popconfirm,
  Form,
  Collapse,
  Avatar,
} from "@arco-design/web-react";
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconUser,
  IconUserGroup,
} from "@arco-design/web-react/icon";
import type { User, Team } from "@/types";

const FormItem = Form.Item;
const CollapseItem = Collapse.Item;

const roleLabels: Record<string, string> = {
  admin: "管理员",
  sales: "销售",
  planner: "计调",
  finance: "财务",
  operation: "运营",
};

const roleBadgeColors: Record<string, string> = {
  admin: "red",
  sales: "blue",
  planner: "green",
  finance: "purple",
  operation: "orange",
};

export default function TeamManagementPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [form] = Form.useForm();

  // Fetch teams
  const {
    data: teamsData,
    isLoading: teamsLoading,
    mutate: mutateTeams,
  } = useSWR<Team[]>("/team?page=1&page_size=100", swrFetcher);

  // Fetch all users for member display
  const { data: usersData } = useSWR<User[]>(
    "/auth/users?page_size=200",
    swrFetcher
  );

  const teams = teamsData || [];
  const allUsers = usersData || [];

  const getTeamMembers = useCallback(
    (teamId: number): User[] => {
      return allUsers.filter((u) => u.team_id === teamId);
    },
    [allUsers]
  );

  const openCreate = () => {
    setEditingTeam(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    form.setFieldsValue({
      name: team.name,
      description: team.description || "",
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);
      if (editingTeam) {
        await api.put(`/team/${editingTeam.id}`, values);
        Message.success("团队更新成功");
      } else {
        await api.post("/team", values);
        Message.success("团队创建成功");
      }
      setModalVisible(false);
      form.resetFields();
      mutateTeams();
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
      await api.delete(`/team/${id}`);
      Message.success("删除成功");
      mutateTeams();
    } catch {
      Message.error("删除失败");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          团队管理
        </h1>
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新建团队
        </Button>
      </div>

      {/* Teams List */}
      {teamsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size={32} />
        </div>
      ) : teams.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Empty description="暂无团队" />
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const members = getTeamMembers(team.id);
            const isExpanded = expandedKeys.includes(String(team.id));

            return (
              <div
                key={team.id}
                className="
                  rounded-xl border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800/60
                  overflow-hidden transition-all duration-200
                  hover:border-brand/30
                "
              >
                {/* Team header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedKeys((prev) =>
                      prev.includes(String(team.id))
                        ? prev.filter((k) => k !== String(team.id))
                        : [...prev, String(team.id)]
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                      <IconUserGroup className="text-brand text-lg" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Tag size="small" color="arcoblue">
                      {members.length} 人
                    </Tag>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="text"
                      size="small"
                      icon={<IconEdit />}
                      onClick={() => openEdit(team)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除该团队?"
                      onOk={() => handleDelete(team.id)}
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
                    <span
                      className={`
                        text-gray-400 transition-transform duration-200
                        ${isExpanded ? "rotate-180" : ""}
                      `}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.47 5.47a.75.75 0 011.06 0L8 7.94l2.47-2.47a.75.75 0 111.06 1.06l-3 3a.75.75 0 01-1.06 0l-3-3a.75.75 0 010-1.06z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Expanded members */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">暂无成员</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="
                              flex items-center gap-3 p-3 rounded-lg
                              bg-gray-50 dark:bg-gray-700/40
                            "
                          >
                            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-sm shrink-0">
                              {member.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {member.email || member.phone}
                              </p>
                            </div>
                            <Tag
                              size="small"
                              color={roleBadgeColors[member.role] || "gray"}
                            >
                              {roleLabels[member.role] || member.role}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingTeam ? "编辑团队" : "新建团队"}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingTeam ? "保存" : "创建"}
        cancelText="取消"
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="团队名称"
            field="name"
            rules={[{ required: true, message: "请输入团队名称" }]}
          >
            <Input placeholder="请输入团队名称" />
          </FormItem>

          <FormItem label="描述" field="description">
            <Input.TextArea
              placeholder="请输入团队描述（选填）"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
