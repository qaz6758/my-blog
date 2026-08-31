// scripts/clean-gallery-metadata.mjs
// 用于批量检测并清洗 Supabase photos 数据表中缺失 width/height/thumbnail_url 的历史记录

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 SUPABASE 环境变量，请检查 .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanGalleryMetadata() {
  console.log('🔍 开始检查 Supabase 中的照片记录...');
  
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, title, url, width, height, thumbnail_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 查询 photos 表失败:', error);
    return;
  }

  console.log(📊 共获取到  条照片记录);

  let needUpdateCount = 0;

  for (const photo of photos) {
    const isMissingDimensions = !photo.width || !photo.height;
    const isMissingThumbnail = !photo.thumbnail_url;

    if (isMissingDimensions || isMissingThumbnail) {
      needUpdateCount++;
      console.log(⚠️ 照片 [] 需要更新:);
      if (isMissingDimensions) console.log(   - 缺少宽高尺寸);
      if (isMissingThumbnail) console.log(   - 缺少独立缩略图);
    }
  }

  if (needUpdateCount === 0) {
    console.log('✅ 所有照片元数据完整，无需更新！');
  } else {
    console.log(ℹ️ 共发现  条历史照片数据可在后续逐步同步。前端已自动通过 CDN 代理进行动态 WebP 缩略图加速。);
  }
}

cleanGalleryMetadata().catch(console.error);
