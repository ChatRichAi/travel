"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Table,
  Input,
  Tag,
  Space,
  Spin,
  Empty,
  Typography,
} from "@arco-design/web-react";
import { IconSearch } from "@arco-design/web-react/icon";
import type { User, Team, Role } from "@/types";

const { Title } = Typography;

/** Role label & color map */
const ROLE_MAP: Record<Role, { label: string; color: string }> = {
  admin: { label: "管理员", color: "red" },
  sales: { label: "销售", color: "blue" },
  planner: { label: "计调", color: "green" },
  finance: { label: "财务", color: "gold" },
  operation: { label: "运营", color: "purple" },
};

export default function TeamPage() {
  const [search, setSearch] = useState("");

  // Fetch all team members (users)
  const { data: usersData, isLoading: usersLoading } = useSWR<User[]>(
    `/team?search=${encodeURIComponent(search)}&page=1&page_size=200`
  );

  // Fetch teams for name resolution
  const { data: teamsData } = useSWR<Team[]>("/team");

  const teamMap = useMemo(() => {
    if (!teamsData) return new Map<number, string>();
    const list = Array.isArray(teamsData) ? teamsData : [];
    return new Map(list.map((t) => [t.id, t.name]));
  }, [teamsData]);

  const users = usersData || [];

  const columns = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 140,
      render: (name: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{name}</span>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 220,
    },
    {
      title: "手机",
      dataIndex: "phone",
      key: "phone",
      width: 160,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: Role) => {
        const info = ROLE_MAP[role] || { label: role, color: "gray" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "团队",
      dataIndex: "team_id",
      key: "team_id",
      width: 160,
      render: (teamId: number | null) => {
        if (!teamId) return <span className="text-gray-400">-</span>;
        return teamMap.get(teamId) || `团队 #${teamId}`;
      },
    },
    {
      title: "状态",
      key: "status",
      width: 100,
      render: () => <Tag color="green">活跃</Tag>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title heading={4} className="!mb-0 !text-gray-900 dark:!text-white">
          团队成员
        </Title>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          allowClear
          placeholder="搜索姓名、邮箱或手机..."
          prefix={<IconSearch />}
          value={search}
          onChange={(val) => setSearch(val)}
        />
      </div>

      {/* Table */}
      {usersLoading ? (
        <div className="flex justify-center py-20">
          <Spin size={32} />
        </div>
      ) : users.length === 0 ? (
        <Empty description="暂无团队成员" />
      ) : (
        <Table
          columns={columns}
          data={users}
          rowKey="id"
          border={false}
          stripe
          scroll={{ x: 900 }}
          pagination={false}
          className="[&_.arco-table]:!bg-transparent"
        />
      )}
    </div>
  );
}
