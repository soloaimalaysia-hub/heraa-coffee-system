"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

interface Product {
  id: string;
  name_zh: string;
  name_en: string;
  image_url: string | null;
  credits_cost: number;
  category: string;
  is_available: boolean;
  sort_order: number;
}

const EMPTY = {
  name_zh: "", name_en: "", image_url: "", credits_cost: "1",
  category: "coffee", is_available: true, sort_order: "0",
};

export default function ProductsTab() {
  const { lang } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("heraa_admin_list_products");
    if (data?.success) setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(p: Product | null) {
    if (p) {
      setForm({
        name_zh: p.name_zh, name_en: p.name_en, image_url: p.image_url || "",
        credits_cost: String(p.credits_cost), category: p.category,
        is_available: p.is_available, sort_order: String(p.sort_order),
      });
      setEditing(p);
    } else {
      setForm(EMPTY);
      setEditing(null);
    }
    setView("edit");
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } else {
      alert(`Upload failed: ${error.message}`);
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.rpc("heraa_admin_upsert_product", {
      p_id: editing?.id || null,
      p_name_zh: form.name_zh,
      p_name_en: form.name_en,
      p_image_url: form.image_url || null,
      p_credits_cost: Number(form.credits_cost),
      p_category: form.category,
      p_is_available: form.is_available,
      p_sort_order: Number(form.sort_order),
    });
    setSaving(false);
    await load();
    setView("list");
  }

  async function toggleAvailable(p: Product) {
    await supabase.rpc("heraa_admin_toggle_product", { p_id: p.id, p_is_available: !p.is_available });
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
          {editing ? (lang === "zh" ? "编辑产品" : "Edit Product") : (lang === "zh" ? "新增产品" : "New Product")}
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

          <Field label={lang === "zh" ? "照片" : "Photo"}>
            <div className="flex items-center gap-3 mt-1">
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                disabled={uploading}
                className="text-xs"
              />
            </div>
            {uploading && <p className="text-xs text-gray-400 mt-1">{lang === "zh" ? "上传中..." : "Uploading..."}</p>}
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label={lang === "zh" ? "所需Credits" : "Credits Cost"}>
              <input type="number" value={form.credits_cost} onChange={(e) => setForm({ ...form, credits_cost: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
            <Field label={lang === "zh" ? "分类" : "Category"}>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="coffee">Coffee</option>
                <option value="matcha">Matcha</option>
              </select>
            </Field>
            <Field label={lang === "zh" ? "排序" : "Sort order"}>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            {lang === "zh" ? "上架中" : "Available"}
          </label>

          <button
            onClick={handleSave}
            disabled={saving || uploading || !form.name_zh || !form.name_en}
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
        <h3 className="font-bold text-lg">🥤 {lang === "zh" ? "产品管理" : "Products"}</h3>
        <button onClick={() => openEdit(null)} className="text-xs text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: "#C8111A" }}>
          + {lang === "zh" ? "新增产品" : "Add Product"}
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{lang === "zh" ? "暂无产品" : "No products yet"}</div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">🥤</div>
              )}
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-800">
                  {lang === "zh" ? p.name_zh : p.name_en}
                </div>
                <div className="text-xs text-gray-400">
                  {p.credits_cost} Credit{p.credits_cost > 1 ? "s" : ""} · {p.category}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                {p.is_available ? "🟢" : "🔴"}
              </span>
              <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">✏️</button>
              <button onClick={() => toggleAvailable(p)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">
                {p.is_available ? "⬇️" : "⬆️"}
              </button>
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
