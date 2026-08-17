-- 017: Admin CRUD RPCs for Package/Product management (Loop B)

create or replace function heraa_admin_list_packages()
returns json language plpgsql security definer as $$
declare v_result json;
begin
  select json_agg(row_to_json(p) order by p.sort_order) into v_result
  from heraa_packages p;
  return json_build_object('success', true, 'packages', coalesce(v_result, '[]'::json));
end; $$;

create or replace function heraa_admin_upsert_package(
  p_id uuid, p_name_zh text, p_name_en text, p_price_rm numeric,
  p_credits int, p_bonus_credits int, p_validity_days int,
  p_description_zh text, p_description_en text, p_is_popular boolean,
  p_is_available boolean, p_sort_order int,
  p_valid_from timestamptz, p_valid_until timestamptz
)
returns json language plpgsql security definer as $$
declare v_id uuid;
begin
  if p_id is null then
    insert into heraa_packages
      (name_zh, name_en, price_rm, credits, bonus_credits, validity_days,
       description_zh, description_en, is_popular, is_available, sort_order,
       valid_from, valid_until)
    values
      (p_name_zh, p_name_en, p_price_rm, p_credits, p_bonus_credits, p_validity_days,
       p_description_zh, p_description_en, p_is_popular, p_is_available, p_sort_order,
       p_valid_from, p_valid_until)
    returning id into v_id;
  else
    update heraa_packages set
      name_zh = p_name_zh, name_en = p_name_en, price_rm = p_price_rm,
      credits = p_credits, bonus_credits = p_bonus_credits, validity_days = p_validity_days,
      description_zh = p_description_zh, description_en = p_description_en,
      is_popular = p_is_popular, is_available = p_is_available, sort_order = p_sort_order,
      valid_from = p_valid_from, valid_until = p_valid_until
    where id = p_id
    returning id into v_id;
  end if;
  return json_build_object('success', true, 'id', v_id);
end; $$;

create or replace function heraa_admin_toggle_package(p_id uuid, p_is_available boolean)
returns json language plpgsql security definer as $$
begin
  update heraa_packages set is_available = p_is_available where id = p_id;
  return json_build_object('success', true);
end; $$;

create or replace function heraa_admin_list_products()
returns json language plpgsql security definer as $$
declare v_result json;
begin
  select json_agg(row_to_json(p) order by p.sort_order) into v_result
  from heraa_products p;
  return json_build_object('success', true, 'products', coalesce(v_result, '[]'::json));
end; $$;

create or replace function heraa_admin_upsert_product(
  p_id uuid, p_name_zh text, p_name_en text, p_image_url text,
  p_credits_cost int, p_category text, p_is_available boolean, p_sort_order int
)
returns json language plpgsql security definer as $$
declare v_id uuid;
begin
  if p_id is null then
    insert into heraa_products (name_zh, name_en, image_url, credits_cost, category, is_available, sort_order)
    values (p_name_zh, p_name_en, p_image_url, p_credits_cost, p_category, p_is_available, p_sort_order)
    returning id into v_id;
  else
    update heraa_products set
      name_zh = p_name_zh, name_en = p_name_en, image_url = p_image_url,
      credits_cost = p_credits_cost, category = p_category,
      is_available = p_is_available, sort_order = p_sort_order
    where id = p_id
    returning id into v_id;
  end if;
  return json_build_object('success', true, 'id', v_id);
end; $$;

create or replace function heraa_admin_toggle_product(p_id uuid, p_is_available boolean)
returns json language plpgsql security definer as $$
begin
  update heraa_products set is_available = p_is_available where id = p_id;
  return json_build_object('success', true);
end; $$;
