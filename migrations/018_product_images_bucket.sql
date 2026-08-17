-- 018: Public storage bucket for Product photos (Admin upload)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "anyone can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images');

create policy "anyone can update product images" on storage.objects
  for update using (bucket_id = 'product-images');
