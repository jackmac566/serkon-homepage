-- 共享影像的二进制存储。
--
-- 国内版没有 R2，图片以 BLOB 形式直接存进 D1。这张表原先是在每个请求里用
-- `CREATE TABLE IF NOT EXISTS` 临时建的，导致每次上传/读图都产生一次 schema 写操作，
-- 而且表结构一旦漂移就没人发现（life_photos 上遗留的 `image_data NOT NULL` 曾让
-- 上传接口 100% 失败）。现在改为部署时一次性建表，请求路径不再执行 DDL。
--
-- 执行：
--   wrangler d1 execute serkon-homepage-db --remote --file drizzle/0006-life-photo-blobs.sql

CREATE TABLE IF NOT EXISTS life_photo_blobs (
  photo_id text PRIMARY KEY NOT NULL,
  image_data blob NOT NULL
);

-- life_photos 的旧表曾带 `image_data` / `owner_token_hash` 两列。若库还是旧结构，
-- 需要重建表（数据量为 0 时无风险）：
--
--   CREATE TABLE life_photos_new (
--     id text PRIMARY KEY NOT NULL,
--     object_key text NOT NULL,
--     owner_email text NOT NULL,
--     owner_name text NOT NULL,
--     original_name text NOT NULL,
--     content_type text NOT NULL,
--     category text DEFAULT '访客影像' NOT NULL,
--     note text DEFAULT '一张来自访客的生活切片' NOT NULL,
--     created_at integer NOT NULL
--   );
--   INSERT INTO life_photos_new (id, object_key, owner_email, owner_name, original_name, content_type, category, note, created_at)
--     SELECT id, object_key, owner_email, owner_name, original_name, content_type, category, note, created_at FROM life_photos;
--   DROP TABLE life_photos;
--   ALTER TABLE life_photos_new RENAME TO life_photos;
--   CREATE UNIQUE INDEX life_photos_object_key_unique ON life_photos (object_key);
--   CREATE INDEX life_photos_owner_created_idx ON life_photos (owner_email, created_at);
