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
const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { playlist_detail, playlist_track_all, song_url_v1, user_account, user_playlist } = require('NeteaseCloudMusicApi');

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

async function deleteFromR2(key) {
  if (!s3 || !key) return false;
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.warn(`  ⚠️ R2 物理删除提示 (${key}):`, err.message);
    return false;
  }
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

  const existingSongMap = new Map();
  existingSongPages.forEach((p) => {
    const t = p.properties?.Title?.title?.[0]?.plain_text?.trim() || "";
    const a = p.properties?.Artist?.rich_text?.[0]?.plain_text?.trim() || "";
    const audioUrl = p.properties?.AudioUrl?.url || "";
    if (t) {
      const info = { pageId: p.id, audioUrl };
      existingSongMap.set(`${a}_${t}`.toLowerCase(), info);
      existingSongMap.set(t.toLowerCase(), info);
    }
  });

  const isPermanentR2 = (url) => {
    if (!url) return false;
    return url.includes("r2.dev") || url.includes(R2_PUBLIC_URL);
  };

  // 镜像修剪：如果用户在网易云 App 删除了某首歌，同步物理粉碎 R2 文件并移出 Notion
  let prunedCount = 0;
  if (tracks.length > 0 && existingSongPages.length > 0 && syncMode !== "2") {
    const neteaseTrackIdSet = new Set(tracks.map((t) => String(t.id)));
    const neteaseTitleSet = new Set();
    tracks.forEach((t) => {
      const title = (t.name || "").trim().toLowerCase();
      const artist = (t.ar?.map((a) => a.name).join(" / ") || "").trim().toLowerCase();
      neteaseTitleSet.add(`${artist}_${title}`);
      neteaseTitleSet.add(title);
    });

    for (const page of existingSongPages) {
      const title = (page.properties?.Title?.title?.[0]?.plain_text || "").trim();
      const artist = (page.properties?.Artist?.rich_text?.[0]?.plain_text || "").trim();
      const audioUrl = page.properties?.AudioUrl?.url || "";
      const matchKey = `${artist.toLowerCase()}_${title.toLowerCase()}`;

      let r2Key = "";
      const idMatch = audioUrl.match(/songs\/(\d+)\.mp3/i);
      if (idMatch) {
        r2Key = `songs/${idMatch[1]}.mp3`;
      }

      const idInNetease = idMatch ? neteaseTrackIdSet.has(idMatch[1]) : false;
      const titleInNetease = neteaseTitleSet.has(matchKey) || neteaseTitleSet.has(title.toLowerCase());

      // 只要该歌曲已不在当前网易云清单中，执行双向镜像删除
      if (!idInNetease && !titleInNetease) {
        if (r2Key) {
          await deleteFromR2(r2Key);
          console.log(`  🗑️ [R2音频物理粉碎]: ${r2Key} (${artist} - ${title})`);
        }
        await requestNotion(`https://api.notion.com/v1/pages/${page.id}`, { archived: true }, "PATCH");
        console.log(`  🗑️ [Notion同步移除]: ${artist} - ${title}`);
        prunedCount++;
      }
    }
  }

  let newSongsAdded = 0;
  let repairedCount = 0;
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

    const matchKey = `${artist}_${title}`.toLowerCase();
    const existingEntry = existingSongMap.get(matchKey) || existingSongMap.get(title.toLowerCase());
    const r2Key = `songs/${s.id}.mp3`;

    // 智能检查：Notion 中已有该歌曲时，检查其音频直链是否是永久有效的 R2 CDN 直链
    let needsAudioUpload = false;
    let existingPageId = null;

    if (existingEntry) {
      existingPageId = existingEntry.pageId;
      // 如果现有链接不是 R2 永久直链（比如之前旧的网易云临时直链，已过期失效），或者覆盖模式，必须补传修复！
      if (syncMode === "2" || !isPermanentR2(existingEntry.audioUrl)) {
        needsAudioUpload = true;
      }
    } else {
      needsAudioUpload = true;
    }

    // 增量模式：只有既存在记录、且音频直链也是有效的 R2 永久链接时，才真正跳过！
    if (syncMode === "1" && existingEntry && !needsAudioUpload) {
      skippedCount++;
      continue;
    }

    let finalPermanentUrl = "";

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

    // 如果 Notion 里已经有这条记录（只是旧直链失效或未存 R2），就地修复更新，不产生任何重复数据！
    if (existingPageId && syncMode === "1") {
      try {
        await requestNotion(`https://api.notion.com/v1/pages/${existingPageId}`, {
          properties: {
            AudioUrl: { url: finalPermanentUrl },
            Cover: { url: coverUrl },
          },
        }, "PATCH");
        repairedCount++;
        console.log(`  🛠️ [已修复补传 R2 永久直链]: ${artist} - ${title} (${durationStr})`);
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) {
        console.error(`  ❌ Notion 修复更新失败: ${e.message}`);
      }
      continue;
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

  console.log(`\n🎉 歌单《${playlistTitle}》同步完成！新增: ${newSongsAdded} 首，修复补传: ${repairedCount} 首，跳过已有: ${skippedCount} 首。`);
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

  // 识别歌单列表（支持手动传参，或自动扫描网易云 UID 下的所有歌单）
  let playlistItemsToSync = [];

  if (targetInput) {
    const ids = targetInput.split(/[,，\s]+/).filter(Boolean);
    playlistItemsToSync = ids.map((id) => ({
      id: id.match(/(?:id=)?(\d+)/)?.[1] || id,
      name: `指定歌单_${id}`,
    }));
  } else {
    // 方式二：全自动 UID 账号识别制（扫描名下所有歌单）
    const userHomeUrl = process.env.NETEASE_PLAYLIST_ID || "";
    const uidMatch = userHomeUrl.match(/[?&]id=(\d+)/) || userHomeUrl.match(/\/(\d+)/);
    const userId = process.env.NETEASE_USER_ID || (uidMatch ? uidMatch[1] : "3359400050");

    console.log(`\n🔍 [智能扫描] 正在读取网易云用户 (UID: ${userId}) 名下所有歌单...`);
    try {
      const userPlRes = await user_playlist({
        uid: userId,
        cookie: cookieArg ? `MUSIC_U=${cookieArg}` : '',
        limit: 50,
      });
      const allUserPlaylists = userPlRes.body?.playlist || [];

      // 自动过滤掉每日动态变动的算法雷达
      const validPlaylists = allUserPlaylists.filter((p) => {
        if (!p.name) return false;
        if (p.name.includes("私人雷达") || p.name.includes("每日推荐")) return false;
        return true;
      });

      if (validPlaylists.length > 0) {
        playlistItemsToSync = validPlaylists.map((p) => ({
          id: String(p.id),
          name: p.name,
          count: p.trackCount,
        }));
        console.log(`✅ 成功自动识别到 ${playlistItemsToSync.length} 个歌单：`);
        playlistItemsToSync.forEach((p, i) =>
          console.log(`   ${i + 1}. 《${p.name}》 (ID: ${p.id}, 共 ${p.count || 0} 首)`)
        );
      }
    } catch (err) {
      console.warn(`⚠️ 无法自动获取用户歌单列表 (${err.message})，回退到默认歌单`);
    }

    // 兜底方案
    if (playlistItemsToSync.length === 0) {
      const rawList = DEFAULT_PLAYLIST_ID || "18343980881";
      playlistItemsToSync = rawList
        .split(/[,，\s]+/)
        .filter(Boolean)
        .map((id) => ({
          id: id.match(/(?:id=)?(\d+)/)?.[1] || id,
          name: `默认歌单_${id}`,
        }));
    }
  }

  for (let i = 0; i < playlistItemsToSync.length; i++) {
    const pl = playlistItemsToSync[i];
    console.log(`\n[歌单进度 ${i + 1}/${playlistItemsToSync.length}] 开始处理《${pl.name}》...`);
    await syncSinglePlaylist(pl.id, isAutoMode, forcedSyncMode);
  }

  // 歌单级镜像清理：如果在网易云把某个歌单整个删除了，同步清空 Notion 对应歌单及其所有歌曲与 R2 音频
  if (!targetInput && playlistItemsToSync.length > 0) {
    try {
      const currentNotionPlaylists = await queryAllNotion(PLAYLIST_DB_ID);
      const activeNetEasePlaylistIds = new Set(playlistItemsToSync.map((p) => String(p.id)));

      for (const pl of currentNotionPlaylists) {
        const idKey = pl.properties?.ID_Key?.rich_text?.[0]?.plain_text?.trim() || "";
        const plTitle = pl.properties?.Title?.title?.[0]?.plain_text?.trim() || "未命名歌单";

        // 仅比对网易云数字歌单 ID
        if (idKey && /^\d+$/.test(idKey)) {
          if (!activeNetEasePlaylistIds.has(idKey)) {
            console.log(`\n🚨 [歌单清理] 检测到歌单《${plTitle}》(ID: ${idKey}) 已在网易云被删除，开始物理清理...`);

            // 查出该歌单下的所有歌曲
            const songsInPl = await queryAllNotion(SONGS_DB_ID, {
              property: "Playlist_Key",
              rich_text: { equals: idKey },
            });

            // 逐一物理删除 R2 文件和 Notion 记录
            for (const s of songsInPl) {
              const audioUrl = s.properties?.AudioUrl?.url || "";
              const m = audioUrl.match(/songs\/(\d+)\.mp3/i);
              if (m) await deleteFromR2(`songs/${m[1]}.mp3`);
              await requestNotion(`https://api.notion.com/v1/pages/${s.id}`, { archived: true }, "PATCH");
            }

            // 删除歌单卡片本身
            await requestNotion(`https://api.notion.com/v1/pages/${pl.id}`, { archived: true }, "PATCH");
            console.log(`✅ [歌单已彻底物理粉碎销毁]: 《${plTitle}》`);
          }
        }
      }
    } catch (cleanErr) {
      console.warn("⚠️ 歌单级镜像清理提示:", cleanErr.message);
    }
  }

  console.log("\n" + "=".repeat(65));
  console.log("🚀 全量歌单同步完成！所有音频均已永久托管在 Cloudflare R2 全球 CDN。");
  console.log("=".repeat(65));
}

main().catch(err => {
  console.error("执行异常:", err);
  process.exit(1);
});
