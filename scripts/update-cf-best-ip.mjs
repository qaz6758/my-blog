// scripts/update-cf-best-ip.mjs
/**
 * Cloudflare 优选 IP 自动同步脚本
 * 定时获取对国内连接质量优良的亚太 Anycast IP，并同步更新至 cdn.vinceou.site A 记录
 */

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ZONE_ID = process.env.CF_ZONE_ID || 'cb90e81a5c68401c9a9d233f5389baf2';
const RECORD_NAME = 'cdn.vinceou.site';

// 高可用亚太保底 IP 池（新加坡/日本/香港优质 Anycast 节点）
const FALLBACK_IPS = [
  '172.64.229.144',
  '172.64.147.171',
  '104.18.40.217',
  '172.64.152.229',
];

async function fetchLatestBestIps() {
  const sources = [
    'https://raw.githubusercontent.com/LancelotRar/best-cf-ips/main/best-cf-ip-scanned-top20.txt',
    'https://fastly.jsdelivr.net/gh/LancelotRar/best-cf-ips@main/best-cf-ip-scanned-top20.txt',
  ];

  for (const src of sources) {
    try {
      console.log(`[BestIP] 正在从数据源拉取最新测速结果: ${src}`);
      const res = await fetch(src, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      const ips = [];
      for (const line of text.split('\n')) {
        const clean = line.trim();
        if (!clean || clean.startsWith('#')) continue;
        const match = clean.match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (match && !ips.includes(match[1])) {
          ips.push(match[1]);
        }
      }
      if (ips.length >= 3) {
        console.log(`[BestIP] 成功拉取到 ${ips.length} 个优质候选 IP`);
        return ips.slice(0, 3);
      }
    } catch (err) {
      console.warn(`[BestIP] 数据源拉取异常: ${err.message}`);
    }
  }

  console.log('[BestIP] 使用亚太高可用保底节点池');
  return FALLBACK_IPS.slice(0, 3);
}

async function syncCloudflareDns(targetIps) {
  if (!CF_API_TOKEN) {
    throw new Error('缺少环境变量 CF_API_TOKEN，请配置后再运行！');
  }

  const headers = {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // 1. 获取当前 cdn.vinceou.site 的所有解析记录
  const listRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${RECORD_NAME}`,
    { headers }
  );
  const listData = await listRes.json();
  if (!listData.success) {
    throw new Error(`Cloudflare 查询失败: ${JSON.stringify(listData.errors)}`);
  }

  const existingRecords = listData.result || [];
  const existingIps = existingRecords.filter((r) => r.type === 'A').map((r) => r.content);

  // 2. 检查是否完全一致，若一致则无需重复修改
  const isIdentical =
    existingRecords.length === targetIps.length &&
    existingRecords.every((r) => r.type === 'A' && targetIps.includes(r.content));

  if (isIdentical) {
    console.log(`[BestIP] 当前 DNS 记录已是最优状态 (${targetIps.join(', ')})，无需变动。`);
    return;
  }

  console.log(`[BestIP] 准备将 ${RECORD_NAME} 更新为优质节点:`, targetIps);

  // 3. 删除旧记录（包括 CNAME 或旧的 A 记录）
  for (const record of existingRecords) {
    if (!targetIps.includes(record.content) || record.type !== 'A') {
      console.log(`[BestIP] 正在删除过时记录: ${record.type} -> ${record.content}`);
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${record.id}`,
        { method: 'DELETE', headers }
      );
    }
  }

  // 4. 补齐目标 A 记录
  for (const ip of targetIps) {
    if (!existingIps.includes(ip)) {
      console.log(`[BestIP] 正在写入优选 A 记录: ${RECORD_NAME} -> ${ip}`);
      const addRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'A',
            name: RECORD_NAME,
            content: ip,
            ttl: 120, // 2分钟快速故障转移
            proxied: false, // DNS Only 保证纯 IP 直连
          }),
        }
      );
      const addData = await addRes.json();
      if (!addData.success) {
        console.error(`[BestIP] 写入记录 ${ip} 失败:`, addData.errors);
      }
    }
  }

  console.log('[BestIP] 优选 IP 同步完成！全网解析已就绪。');
}

async function main() {
  const targetIps = await fetchLatestBestIps();
  await syncCloudflareDns(targetIps);
}

main().catch((err) => {
  console.error('[BestIP Error]:', err);
  process.exit(1);
});
