// scripts/sync-photos.js
/**
 * 一键将 Supabase Storage "gallery" 存储桶中的所有图片自动同步到 photos 数据表
 * 彻底告别手动复制粘贴 URL！
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function syncPhotos() {
  console.log("🔄 开始扫描 Supabase Storage 中的 'gallery' 存储桶...");

  // 1. 列出存储桶中所有文件
  const { data: files, error: listError } = await supabase.storage.from("gallery").list("", {
    limit: 500,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (listError) {
    console.error("❌ 获取存储桶文件失败:", listError.message);
    return;
  }

  // 过滤出合法图片格式，忽略子文件夹与隐藏文件
  const imageFiles = (files || []).filter((f) => {
    if (!f.name || f.name.startsWith(".")) return false;
    const ext = f.name.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic"].includes(ext);
  });

  console.log(`📦 存储桶中找到 ${imageFiles.length} 张图片`);

  if (imageFiles.length === 0) {
    console.log("ℹ️ 存储桶为空，无需同步。请先在 Supabase Storage 的 gallery 桶中上传照片。");
    return;
  }

  // 2. 获取数据库 photos 表中现有的所有图片 URL
  const { data: existingPhotos, error: dbError } = await supabase
    .from("photos")
    .select("url");

  if (dbError) {
    console.error("❌ 读取 photos 数据表失败:", dbError.message);
    return;
  }

  const existingUrls = new Set((existingPhotos || []).map((p) => p.url));

  // 3. 找出需要入库的新图片
  let newPhotos = [];
  for (const file of imageFiles) {
    const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(file.name);
    if (!existingUrls.has(publicUrl)) {
      newPhotos.push({
        url: publicUrl,
        created_at: file.created_at || new Date().toISOString(),
      });
    }
  }

  if (newPhotos.length === 0) {
    console.log("✨ 所有图片均已在 photos 表中，没有需要新增的记录！");
    return;
  }

  console.log(`🚀 正在将 ${newPhotos.length} 张新图片批量写入 photos 数据表...`);

  const { data: inserted, error: insertError } = await supabase
    .from("photos")
    .insert(newPhotos)
    .select();

  if (insertError) {
    console.error("❌ 批量写入失败:", insertError.message);
  } else {
    console.log(`🎉 成功同步 ${inserted.length} 张图片到画廊数据表！`);
  }
}

syncPhotos();
