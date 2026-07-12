"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  name: string;
  phone: string;
  staff_id: string;
  company: string;
  created_at: string;
  balance: number;
  monthly_allowance: number;
  total_redemptions: number;
}

export default function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const { data } = await supabase.rpc("heraa_admin_members_list", {
      p_search: q,
    });
    if (data) setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(search);
  }, [load, search]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-3 border border-gray-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 搜索姓名 / 手机号 / 工号"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            👥 会员列表
          </div>
          <div className="text-[10px] text-gray-400">
            共 {members.length} 位
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-300 animate-pulse">
            加载中...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-300">
            {search ? "未找到匹配会员" : "暂无会员"}
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center px-4 py-3 border-b border-gray-50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {m.name}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {m.phone} · {m.staff_id || "—"}
                </div>
                <div className="text-[10px] text-gray-400">
                  {m.total_redemptions} 笔兑换 · {m.company}
                </div>
              </div>
              <div className="ml-2 flex flex-col items-end gap-1">
                <div
                  className="text-[11px] font-semibold px-2 py-1 rounded-md"
                  style={{
                    background: "#dcfce7",
                    color: "#0F6E56",
                  }}
                >
                  RM {Number(m.balance).toFixed(2)}
                </div>
                <div className="text-[9px] text-gray-400">
                  /{Number(m.monthly_allowance).toFixed(0)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
