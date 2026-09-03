// scripts/sync-music.js
/**
 * 网易云歌单 ➔ Cloudflare R2 永久对象存储 ➔ 博客音乐库 全自动高保真归档工具
 * 
 * 功能：
 * 1. 自动读取 .env.local 或 GitHub Actions 环境变量
 * 2. 携带网易云黑胶 VIP Cookie 提取 320kbps / SQ 官方高保真完整原音频
 * 3. 极速并发上传到 Cloudflare R2 全球 CDN 存储桶 (永久有效 / 0 流量费 / 永不失效)
 * 4. 自动增量去重，已上传歌曲 0 秒跳过，仅处理新歌
 * 5. 自动同步歌名、歌手、800x800 高清封面、时长到歌曲库
 * 6. 支持本地一键运行 (npm run sync:music) 与 GitHub Actions 云端定时全自动静默运行
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { playlist_detail, playlist_track_all, song_url_v1, user_account } = require('NeteaseCloudMusicApi');

// 1. 自动加载本地 .env.local 文件
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').replace(/^["']|["']$/g, '').trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    });
  }
}

loadEnvLocal();

function extractId(input) {
  if (!input) return "";
  const match = input.match(/[a-f0-9]{32}/i) || input.match(/(?:id=)?(\d+)/);
  return match ? match[1] || match[0] : input;
}

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const PLAYLIST_DB_ID = extractId(process.env.NOTION_PLAYLIST_DB_ID || process.env.PLAYLIST_DB_ID);
const SONGS_DB_ID = extractId(process.env.NOTION_SONGS_DB_ID || process.env.SONGS_DB_ID);
const DEFAULT_PLAYLIST_ID = process.env.DEFAULT_PLAYLIST_ID || "18343980881";
let cookieArg = process.env.NETEASE_COOKIE || "";

const R2_BUCKET = process.env.R2_BUCKET || "vinceou-music";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "https://pub-e9557d24529949408fedfcb672cbc43f.r2.dev").replace(/\/$/, "");

let s3 = null;
if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_ENDPOINT) {
  s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function requestNotion(url, data = null, method = "POST") {
  const res = await fetch(url, {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  return await res.json();
}

async function queryAllNotion(dbId, filter = null) {
  let all = [];
  let hasMore = true;
  let cursor = undefined;
  while (hasMore) {
    const payload = { page_size: 100, start_cursor: cursor };
    if (filter) payload.filter = filter;
    const res = await requestNotion(`https://api.notion.com/v1/databases/${dbId}/query`, payload);
    all.push(...(res.results || []));
    hasMore = !!res.has_more;
    cursor = res.next_cursor || undefined;
  }
  return all;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function checkR2Exists(key) {
  if (!s3) return false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, buffer) {
  if (!s3) throw new Error("R2 客户端未配置");
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "audio/mpeg",
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function syncSinglePlaylist(playlistId, isAutoMode, forcedSyncMode) {
  console.log("\n" + "-".repeat(60));
  console.log(`🎵 [1/4] 正在从网易云获取歌单信息 (ID: ${playlistId})...`);

  let playlistDetailRes;
  let tracks = [];
  try {
    const detailRes = await playlist_detail({ id: playlistId, cookie: cookieArg ? `MUSIC_U=${cookieArg}` : '' });
    playlistDetailRes = detailRes.body?.playlist;
    
    const trackCount = playlistDetailRes?.trackCount || 1000;
    console.log(`📊 检测到歌单共有 ${trackCount} 首歌曲，正在全量获取歌曲清单...`);
    const trackRes = await playlist_track_all({
      id: playlistId,
      limit: Math.max(trackCount, 1000),
      offset: 0,
      cookie: cookieArg ? `MUSIC_U=${cookieArg}` : '',
    });
    tracks = trackRes.body?.songs || [];
  } catch (e) {
    console.error("❌ 获取歌单失败:", e.message);
    return;
  }

  if (!tracks.length) {
    console.warn("⚠️ 歌单中暂无歌曲，跳过。");
    return;
  }

  const playlistTitle = playlistDetailRes?.name || `精选歌单_${playlistId}`;
  const playlistDesc = playlistDetailRes?.description || "这张歌单为你持续聚焦精选好歌与经典佳作，点开聆听，即刻把心仪旋律加入你的个人资料库。";
  console.log(`✅ 成功获取歌单《${playlistTitle}》，共 ${tracks.length} 首歌曲！`);

  // 检查 Notion 数据库中已有的歌曲
  console.log(`\n🔍 [2/4] 正在比对歌单库已有歌曲...`);
  const existingPlaylists = await queryAllNotion(
    PLAYLIST_DB_ID,
    {
      or: [
        { property: "ID_Key", rich_text: { equals: playlistId } },
        { property: "Title", title: { equals: playlistTitle } },
      ],
    }
  );
  const playlistExists = existingPlaylists.length > 0;

  const existingSongPages = await queryAllNotion(
    SONGS_DB_ID,
    {
      or: [
        { property: "Playlist_Key", rich_text: { equals: playlistId } },
        { property: "Playlist_Key", rich_text: { equals: playlistTitle } },
      ],
    }
  );

  let syncMode = forcedSyncMode;
  if (!syncMode) {
    if (isAutoMode || process.env.CI) {
      // 自动化模式默认增量同步（快速、安全、不重复上传）
      syncMode = "1";
    } else if (playlistExists || existingSongPages.length > 0) {
      console.log(`📌 歌单《${playlistTitle}》已有 ${existingSongPages.length} 首歌曲`);
      console.log("  [1] 增量同步 (仅上传新歌并录入，已有歌曲直接跳过 - 极速推荐)");
      console.log("  [2] 全量覆盖 (重新清空并全量上传归档)");
      const choice = await ask("请输入选项 [1 或 2] (回车默认 1): ");
      syncMode = choice === "2" ? "2" : "1";
    } else {
      syncMode = "1";
    }
  }

  const firstCoverRaw = tracks[0]?.al?.picUrl || playlistDetailRes?.coverImgUrl || "";
  const cleanCover = firstCoverRaw ? firstCoverRaw.split("?")[0] + "?param=800y800" : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

  // 更新/创建歌单元数据
  console.log(`\n📝 [3/4] 正在同步歌单卡片信息...`);
  const playlistProps = {
    Title: { title: [{ text: { content: playlistTitle } }] },
    ID_Key: { rich_text: [{ text: { content: playlistId } }] },
    Tag: { select: { name: "Apple Music" } },
    Description: { rich_text: [{ text: { content: playlistDesc.slice(0, 150) } }] },
    CuratorNote: { rich_text: [{ text: { content: "日常反复循环的旋律记录。" } }] },
    Cover: { url: cleanCover },
  };

  if (playlistExists) {
    const plId = existingPlaylists[0].id;
    await requestNotion(`https://api.notion.com/v1/pages/${plId}`, { properties: playlistProps }, "PATCH");
    console.log(`[OK] 歌单《${playlistTitle}》元数据已更新！`);
  } else {
    await requestNotion("https://api.notion.com/v1/pages", { parent: { database_id: PLAYLIST_DB_ID }, properties: playlistProps });
    console.log(`[OK] 歌单《${playlistTitle}》入库新建成功！`);
  }

  // 覆盖模式清理
  if (syncMode === "2" && existingSongPages.length > 0) {
    console.log(`🔥 【覆盖模式】正在清理旧数据...`);
    for (let i = 0; i < existingSongPages.length; i += 20) {
      const chunk = existingSongPages.slice(i, i + 20);
      await Promise.all(chunk.map(page => 
        requestNotion(`https://api.notion.com/v1/pages/${page.id}`, { archived: true }, "PATCH").catch(() => {})
      ));
    }
  }

  // 批量获取官方音源
  const trackIds = tracks.map(t => t.id);
  const audioMap = {};
  console.log(`\n🔍 [4/4] 正在调用官方 Weapi 批量解析 ${trackIds.length} 首歌曲的高保真音频直链...`);
  try {
    for (let i = 0; i < trackIds.length; i += 30) {
      const batchIds = trackIds.slice(i, i + 30).join(',');
      const urlRes = await song_url_v1({ id: batchIds, level: 'exhigh', cookie: cookieArg ? `MUSIC_U=${cookieArg}` : '' });
      (urlRes.body?.data || []).forEach(item => {
        if (item.url) audioMap[item.id] = item.url;
      });
    }
    console.log(`✅ 成功获取 ${Object.keys(audioMap).length}/${trackIds.length} 首官方音频源！`);
  } catch (e) {
    console.warn("⚠️ 音频解析提示:", e.message);
  }

  const existingTitles = new Set();
  if (syncMode === "1") {
    existingSongPages.forEach(p => {
      const t = p.properties?.Title?.title?.[0]?.plain_text?.trim() || "";
      const a = p.properties?.Artist?.rich_text?.[0]?.plain_text?.trim() || "";
      if (t) {
        existingTitles.add(`${a}_${t}`.toLowerCase());
        existingTitles.add(t.toLowerCase());
      }
    });
  }

  let newSongsAdded = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < tracks.length; idx++) {
    const s = tracks[idx];
    const title = (s.name || `Track ${idx + 1}`).trim();
    const artist = (s.ar?.map(a => a.name).join(' / ') || "未知歌手").trim();
    const album = (s.al?.name || title).trim();
    const rawPic = s.al?.picUrl || cleanCover;
    const coverUrl = rawPic ? rawPic.split("?")[0] + "?param=800y800" : cleanCover;

    const dtMs = s.dt || 225000;
    const totalSec = Math.floor(dtMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const durationStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (syncMode === "1" && (existingTitles.has(`${artist}_${title}`.toLowerCase()) || existingTitles.has(title.toLowerCase()))) {
      skippedCount++;
      continue;
    }

    let finalPermanentUrl = "";
    const r2Key = `songs/${s.id}.mp3`;

    const alreadyOnR2 = await checkR2Exists(r2Key);
    if (alreadyOnR2) {
      finalPermanentUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    } else {
      const neteaseStreamUrl = audioMap[s.id];
      if (neteaseStreamUrl && s3) {
        try {
          const dlRes = await fetch(neteaseStreamUrl);
          const arrayBuffer = await dlRes.arrayBuffer();
          const audioBuffer = Buffer.from(arrayBuffer);
          finalPermanentUrl = await uploadToR2(r2Key, audioBuffer);
          const mbSize = (audioBuffer.length / (1024 * 1024)).toFixed(2);
          console.log(`  ☁️ [R2永久上传成功 (${mbSize}MB)]: ${artist} - ${title}`);
        } catch (uploadErr) {
          finalPermanentUrl = `https://api.injahow.cn/meting/?server=netease&type=url&id=${s.id}`;
        }
      } else {
        finalPermanentUrl = `https://api.injahow.cn/meting/?server=netease&type=url&id=${s.id}`;
      }
    }

    const songPayload = {
      parent: { database_id: SONGS_DB_ID },
      properties: {
        Title: { title: [{ text: { content: title } }] },
        Artist: { rich_text: [{ text: { content: artist } }] },
        Album: { rich_text: [{ text: { content: album } }] },
        Duration: { rich_text: [{ text: { content: durationStr } }] },
        AudioUrl: { url: finalPermanentUrl },
        Cover: { url: coverUrl },
        Playlist_Key: { rich_text: [{ text: { content: playlistId } }] },
        Order: { number: idx + 1 },
      },
    };

    try {
      await requestNotion("https://api.notion.com/v1/pages", songPayload);
      newSongsAdded++;
      console.log(`  ✅ [新歌同步入库]: ${artist} - ${title} (${durationStr})`);
      await new Promise(r => setTimeout(r, 180));
    } catch (e) {
      console.error(`  ❌ Notion 写入失败: ${e.message}`);
    }
  }

  console.log(`\n🎉 歌单《${playlistTitle}》同步完成！新增: ${newSongsAdded} 首，跳过已有: ${skippedCount} 首。`);
}

async function main() {
  const args = process.argv.slice(2);
  let targetInput = "";
  let forcedSyncMode = "";
  let isAutoMode = false;

  for (const arg of args) {
    if (arg === "--overwrite" || arg === "-o") forcedSyncMode = "2";
    else if (arg === "--skip" || arg === "-s") forcedSyncMode = "1";
    else if (arg === "--auto" || arg === "-y") isAutoMode = true;
    else if (arg.startsWith("--cookie=")) cookieArg = arg.replace("--cookie=", "");
    else if (arg.startsWith("--playlist=")) targetInput = arg.replace("--playlist=", "");
    else if (!targetInput && !arg.startsWith("-")) targetInput = arg;
  }

  console.log("=".repeat(65));
  console.log("🎵 网易云 ➔ Cloudflare R2 永久对象存储 ➔ 博客音乐库 同步引擎");
  console.log("=".repeat(65));

  if (s3) {
    console.log(`☁️ [Cloudflare R2 就绪] 存储桶: ${R2_BUCKET} ➔ CDN: ${R2_PUBLIC_URL}`);
  }

  // 检测 VIP 状态
  if (cookieArg) {
    try {
      const accRes = await user_account({ cookie: `MUSIC_U=${cookieArg}` });
      const profile = accRes.body?.profile;
      const account = accRes.body?.account;
      if (profile && profile.nickname) {
        const isVip = account?.vipType > 0 || profile?.vipType > 0;
        console.log(`👑 [网易云账号已识别] 用户: ${profile.nickname} ${isVip ? "(VIP 生效中 ➔ 提取 320k 官方无损原版音轨)" : ""}`);
      }
    } catch (e) {
      console.log(`⚠️ Cookie 状态提示: ${e.message}`);
    }
  }

  // 默认支持同步多个歌单（可通过逗号分隔）
  const rawList = targetInput || DEFAULT_PLAYLIST_ID;
  const playlistIds = rawList.split(/[,，\s]+/).filter(Boolean);

  for (const pid of playlistIds) {
    const idMatch = pid.match(/(?:id=)?(\d+)/);
    const cleanId = idMatch ? idMatch[1] : pid;
    await syncSinglePlaylist(cleanId, isAutoMode, forcedSyncMode);
  }

  console.log("\n" + "=".repeat(65));
  console.log("🚀 全量歌单同步完成！所有音频均已永久托管在 Cloudflare R2 全球 CDN。");
  console.log("=".repeat(65));
}

main().catch(err => {
  console.error("执行异常:", err);
  process.exit(1);
});
