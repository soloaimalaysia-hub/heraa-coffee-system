"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface Pkg {
  id: string;
  name_zh: string;
  name_en: string;
  price_rm: number;
  credits: number;
  bonus_credits: number;
  validity_days: number;
  description_zh: string | null;
  description_en: string | null;
  is_popular: boolean;
  is_available: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
}

const EMPTY = {
  name_zh: "", name_en: "", price_rm: "", credits: "", bonus_credits: "0",
  validity_days: "30", description_zh: "", description_en: "",
  is_popular: false, is_available: true, sort_order: "0",
  valid_from: "", valid_until: "",
};

export default function PackagesTab() {
  const { lang } = useLang();
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_admin_list_packages");
    if (data?.success) setPackages(data.packages || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(pkg: Pkg | null) {
    if (pkg) {
      setForm({
        name_zh: pkg.name_zh, name_en: pkg.name_en, price_rm: String(pkg.price_rm),
        credits: String(pkg.credits), bonus_credits: String(pkg.bonus_credits),
        validity_days: String(pkg.validity_days),
        description_zh: pkg.description_zh || "", description_en: pkg.description_en || "",
        is_popular: pkg.is_popular, is_available: pkg.is_available, sort_order: String(pkg.sort_order),
        valid_from: pkg.valid_from ? pkg.valid_from.slice(0, 16) : "",
        valid_until: pkg.valid_until ? pkg.valid_until.slice(0, 16) : "",
      });
      setEditing(pkg);
    } else {
      setForm(EMPTY);
      setEditing(null);
    }
    setView("edit");
  }

  async function handleSave() {
    setSaving(true);
    await supabase.rpc("heraa_admin_upsert_package", {
      p_id: editing?.id || null,
      p_name_zh: form.name_zh,
      p_name_en: form.name_en,
      p_price_rm: Number(form.price_rm),
      p_credits: Number(form.credits),
      p_bonus_credits: Number(form.bonus_credits),
      p_validity_days: Number(form.validity_days),
      p_description_zh: form.description_zh || null,
      p_description_en: form.description_en || null,
      p_is_popular: form.is_popular,
      p_is_available: form.is_available,
      p_sort_order: Number(form.sort_order),
      p_valid_from: form.valid_from || null,
      p_valid_until: form.valid_until || null,
    });
    setSaving(false);
    await load();
    setView("list");
  }

  async function toggleAvailable(pkg: Pkg) {
    await supabase.rpc("heraa_admin_toggle_package", { p_id: pkg.id, p_is_available: !pkg.is_available });
    load();
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  if (view === "edit") {
    return (
      <div>
        <button onClick={() => setView("list")} className="text-sm mb-4" style={{ color: "#C8111A" }}>
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
        <h3 className="font-bold text-lg mb-4">
          {editing ? (lang === "zh" ? "编辑配套" : "Edit Package") : (lang === "zh" ? "新增配套" : "New Package")}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "zh" ? "名称（中文）" : "Name (ZH)"}>
              <input value={form.name_zh} onChange={(e) => setForm({ ...form, name_zh: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "名称（英文）" : "Name (EN)"}>
              <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={lang === "zh" ? "价格 (RM)" : "Price (RM)"}>
              <input type="number" value={form.price_rm} onChange={(e) => setForm({ ...form, price_rm: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "Credits数" : "Credits"}>
              <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "赠送Credits" : "Bonus Credits"}>
              <input type="number" value={form.bonus_credits} onChange={(e) => setForm({ ...form, bonus_credits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "zh" ? "有效天数" : "Validity (days)"}>
              <input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "排序" : "Sort order"}>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
          </div>
          <Field label={lang === "zh" ? "说明（中文）" : "Description (ZH)"}>
            <textarea value={form.description_zh} onChange={(e) => setForm({ ...form, description_zh: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
          </Field>
          <Field label={lang === "zh" ? "说明（英文）" : "Description (EN)"}>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "zh" ? "限时上架开始（可留空）" : "Available from (optional)"}>
              <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "限时下架时间（可留空）" : "Available until (optional)"}>
              <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} />
              {lang === "zh" ? "推荐标签" : "Popular badge"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              {lang === "zh" ? "上架中" : "Available"}
            </label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.name_zh || !form.name_en || !form.price_rm || !form.credits}
            className="w-full text-white font-bold rounded-lg py-3 mt-4 disabled:opacity-50"
            style={{ background: "#C8111A" }}
          >
            {saving ? "..." : (lang === "zh" ? "保存" : "Save")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">📦 {lang === "zh" ? "配套管理" : "Packages"}</h3>
        <button onClick={() => openEdit(null)} className="text-xs text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: "#C8111A" }}>
          + {lang === "zh" ? "新增配套" : "Add Package"}
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{lang === "zh" ? "暂无配套" : "No packages yet"}</div>
      ) : (
        <div className="space-y-3">
          {packages.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-800">
                    {lang === "zh" ? p.name_zh : p.name_en} {p.is_popular && "⭐"}
                  </h4>
                  <p className="text-xs text-gray-400">
                    RM{p.price_rm} · {p.credits}+{p.bonus_credits} credits · {p.validity_days}{lang === "zh" ? "天" : "d"}
                  </p>
                  {(p.valid_from || p.valid_until) && (
                    <p className="text-xs mt-1" style={{ color: "#D4AF37" }}>
                      ⏱ {p.valid_from ? new Date(p.valid_from).toLocaleDateString() : "-"} → {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : "-"}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {p.is_available ? "🟢" : "🔴"} {p.is_available ? (lang === "zh" ? "上架" : "Live") : (lang === "zh" ? "下架" : "Off")}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                  ✏️ {lang === "zh" ? "编辑" : "Edit"}
                </button>
                <button onClick={() => toggleAvailable(p)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                  {p.is_available ? "⬇️" : "⬆️"} {p.is_available ? (lang === "zh" ? "下架" : "Deactivate") : (lang === "zh" ? "上架" : "Activate")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}
