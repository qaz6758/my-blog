import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const apiRepository = "https://github.com/MakcRe/KuGouMusicApi.git";
const apiCommit = "da5ccfd9304c043085a2fd18e94ebc5c315044ab";
const apiDirectory = join(
  process.env.LOCALAPPDATA ||
    (process.platform === "win32"
      ? join(homedir(), "AppData", "Local")
      : join(homedir(), ".cache")),
  "my-blog-kugou-concept-login"
);
const envFile = join(process.cwd(), ".env.local");
const apiPort = await getAvailablePort();
const apiUrl = `http://127.0.0.1:${apiPort}`;
const session = randomUUID();
const qrUrl = `http://127.0.0.1:${await getAvailablePort()}/?session=${session}`;
let apiProcess;
let qrServer;
let qrKey;
const apiCookies = new Map();
let state = { status: "starting", message: "准备启动本地登录服务……" };
let exiting = false;

function log(message) {
  process.stdout.write(`${message}\n`);
}

function run(command, args, options = {}) {
  const isWindowsNpm = process.platform === "win32" && command === "npm";
  const executable = isWindowsNpm ? process.env.ComSpec || "cmd.exe" : command;
  const executableArgs = isWindowsNpm
    ? ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`]
    : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    stdio: options.stdio || "inherit",
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result.stdout || "";
}

async function getAvailablePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a local port");
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

async function ensureCommunityApi() {
  await mkdir(dirname(apiDirectory), { recursive: true });
  if (!(await exists(join(apiDirectory, ".git")))) {
    log("首次运行：下载酷狗社区 API 到本机工具目录（不会加入你的网站仓库）。");
    await mkdir(apiDirectory, { recursive: true });
    run("git", ["init"], { cwd: apiDirectory });
    run("git", ["remote", "add", "origin", apiRepository], { cwd: apiDirectory });
    run("git", ["fetch", "--depth", "1", "origin", apiCommit], { cwd: apiDirectory });
    run("git", ["checkout", "--detach", "FETCH_HEAD"], { cwd: apiDirectory });
  }

  const remote = run("git", ["remote", "get-url", "origin"], {
    cwd: apiDirectory,
    stdio: "pipe",
  }).trim();
  const revision = run("git", ["rev-parse", "HEAD"], {
    cwd: apiDirectory,
    stdio: "pipe",
  }).trim();
  const changes = run("git", ["status", "--porcelain"], {
    cwd: apiDirectory,
    stdio: "pipe",
  }).trim();
  if (remote !== apiRepository || revision !== apiCommit || changes) {
    throw new Error("本机社区 API 源码与固定版本不一致；为保护账号，已停止登录。");
  }

  const packageFile = join(apiDirectory, "package.json");
  if (!(await exists(join(apiDirectory, "node_modules")))) {
    log("正在安装本地登录工具依赖……");
    run("npm", ["install", "--no-audit", "--no-fund", "--no-package-lock"], {
      cwd: apiDirectory,
    });
  }

  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));
  if (
    typeof packageJson.scripts?.dev !== "string" ||
    packageJson.scripts?.start !== "node app.js"
  ) {
    throw new Error("下载的社区 API 项目结构与预期不符，已停止启动。");
  }

  const dotenvFile = join(apiDirectory, ".env");
  const oldEnv = (await exists(dotenvFile))
    ? await readFile(dotenvFile, "utf8")
    : "";
  const lines = oldEnv
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:platform|PORT|HOST)\s*=/.test(line));
  lines.push("platform=lite", `PORT=${apiPort}`, "HOST=127.0.0.1");
  await writeFile(dotenvFile, `${lines.filter(Boolean).join("\n")}\n`, {
    mode: 0o600,
  });

  const childEnv = { ...process.env, PORT: String(apiPort), HOST: "127.0.0.1" };
  for (const key of Object.keys(childEnv)) {
    if (/TOKEN|SECRET|COOKIE|PASSWORD|SUPABASE|NOTION|AUTH/i.test(key)) {
      delete childEnv[key];
    }
  }
  apiProcess = spawn(process.execPath, ["app.js"], {
    cwd: apiDirectory,
    env: childEnv,
    stdio: "ignore",
    windowsHide: true,
  });
  apiProcess.once("error", (error) => {
    state = { status: "error", message: `本地 API 启动失败：${error.message}` };
  });
}

async function waitForApi() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (apiProcess?.exitCode !== null && apiProcess?.exitCode !== undefined) {
      throw new Error(`酷狗社区 API exited with code ${apiProcess.exitCode}`);
    }
    try {
      const response = await fetch(`${apiUrl}/`, { signal: AbortSignal.timeout(1000) });
      if (response.ok || response.status < 500) return;
    } catch {
      await delay(500);
    }
  }
  throw new Error("本地酷狗 API 启动超时。");
}

function findValue(value, targetNames, visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return undefined;
  visited.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (targetNames.includes(key.toLowerCase()) && typeof child === "string" && child) {
      return child;
    }
  }
  for (const child of Object.values(value)) {
    const found = findValue(child, targetNames, visited);
    if (found) return found;
  }
  return undefined;
}

function collectCookiePairs(value, result = new Map(), visited = new Set()) {
  if (!value || typeof value !== "object" || visited.has(value)) return result;
  visited.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (key.toLowerCase() === "cookie" && Array.isArray(child)) {
      for (const item of child) {
        if (typeof item !== "string") continue;
        const pair = item.split(";", 1)[0];
        const separator = pair.indexOf("=");
        if (separator > 0) {
          result.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
        }
      }
    }
    if (["token", "userid", "dfid", "kugou_api_mid", "mid"].includes(key.toLowerCase())) {
      if (typeof child === "string" || typeof child === "number") {
        const cookieName = key.toLowerCase() === "mid" ? "KUGOU_API_MID" : key;
        result.set(cookieName, String(child));
      }
    }
    collectCookiePairs(child, result, visited);
  }
  return result;
}

async function requestApi(path) {
  const cookieHeader = [...apiCookies.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Authorization: cookieHeader } : {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Community API returned HTTP ${response.status}`);
  for (const cookie of response.headers.getSetCookie?.() || []) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) {
      apiCookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    }
  }
  const data = await response.json();
  collectCookiePairs(data, apiCookies);
  return data;
}

async function saveCredential(pairs) {
  const getCookie = (name) =>
    [...pairs].find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  const token = getCookie("token");
  const userId = getCookie("userid");
  if (!token || !userId) {
    throw new Error("登录成功响应中没有找到 token 和 userid，未保存凭证。");
  }
  const credentialPairs = [
    ["token", token],
    ["userid", userId],
    ["dfid", getCookie("dfid")],
    ["KUGOU_API_MID", getCookie("KUGOU_API_MID") || getCookie("mid")],
  ].filter((entry) => entry[1]);
  const credential = credentialPairs
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  let content = "";
  try {
    content = await readFile(envFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const entry = `KUGOU_CONCEPT_COOKIE=${JSON.stringify(credential)}`;
  const pattern = /^KUGOU_CONCEPT_COOKIE=.*$/m;
  const updated = pattern.test(content)
    ? content.replace(pattern, entry)
    : `${content.trimEnd()}${content.trim() ? "\n" : ""}${entry}\n`;
  const temporaryFile = `${envFile}.${session}.tmp`;
  await writeFile(temporaryFile, updated, { mode: 0o600 });
  await rename(temporaryFile, envFile);
}

function htmlPage() {
  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>酷狗概念版登录</title>
<style>
body{font:16px system-ui,sans-serif;background:#f5f5f5;color:#222;display:grid;place-items:center;min-height:90vh;margin:0}
main{background:white;padding:32px;border-radius:16px;text-align:center;max-width:440px;box-shadow:0 8px 32px #0001}
img{width:240px;height:240px;object-fit:contain}p{line-height:1.6;color:#555}#status{font-weight:600;color:#087f5b}
</style>
<main><h1>登录酷狗概念版</h1><p>用手机上的<strong>酷狗概念版</strong>扫描二维码并确认登录。二维码和凭证只在本机处理。</p>
<img src="/qr?session=${session}" alt="酷狗登录二维码"><p id="status">等待扫码……</p>
<script>
const session=${JSON.stringify(session)};
async function update(){try{const response=await fetch('/status?session='+encodeURIComponent(session));const state=await response.json();document.querySelector('#status').textContent=state.message;if(state.status==='done')document.querySelector('img').hidden=true;if(state.status==='error')document.querySelector('#status').style.color='#c92a2a'}catch{document.querySelector('#status').textContent='连接本机助手失败，请回到终端查看信息'}}setInterval(update,1500);update();
</script></main></html>`;
}

async function startQrServer() {
  qrServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url || "/", qrUrl);
    if (url.searchParams.get("session") !== session) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(htmlPage());
      return;
    }
    if (url.pathname === "/status") {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      }).end(JSON.stringify(state));
      return;
    }
    if (url.pathname === "/qr") {
      try {
        const qr = await requestApi(
          `/login/qr/create?key=${encodeURIComponent(qrKey)}&qrimg=1`
        );
        const base64 = findValue(qr, ["base64"]);
        if (!base64) throw new Error("社区 API 没有返回二维码图片。");
        const imageData = base64.replace(/^data:image\/[^;]+;base64,/, "");
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        }).end(Buffer.from(imageData, "base64"));
      } catch (error) {
        res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" })
          .end(error instanceof Error ? error.message : "二维码加载失败");
      }
      return;
    }
    res.writeHead(404).end("Not found");
  });
  const port = Number(new URL(qrUrl).port);
  await new Promise((resolve, reject) => {
    qrServer.once("error", reject);
    qrServer.listen(port, "127.0.0.1", resolve);
  });
}

async function openBrowser() {
  const command =
    process.platform === "win32"
      ? ["cmd.exe", ["/c", "start", "", qrUrl]]
      : process.platform === "darwin"
        ? ["open", [qrUrl]]
        : ["xdg-open", [qrUrl]];
  const child = spawn(command[0], command[1], { stdio: "ignore", detached: true });
  child.once("error", () => {
    log(`浏览器未能自动打开，请手动访问：${qrUrl}`);
  });
  child.unref();
}

async function pollLogin() {
  while (!exiting) {
    const result = await requestApi(`/login/qr/check?key=${encodeURIComponent(qrKey)}`);
    const payload = result?.body || result;
    const loginStatus = Number(
      payload?.data?.status ??
      result?.data?.status ??
      findValue(payload, ["qrstatus", "loginstatus"])
    );
    if (loginStatus === 4) {
      await saveCredential(apiCookies);
      state = {
        status: "done",
        message: "登录成功，凭证已写入项目 .env.local。部署前还需将它配置为 Cloudflare Secret。",
      };
      log("登录成功；已将凭证写入 .env.local（内容不会打印到终端）。");
      return;
    }
    if (loginStatus === 0) {
      state = { status: "error", message: "二维码已过期，请重新运行 npm run kugou:login。" };
      throw new Error("登录二维码已过期。");
    }
    state = {
      status: "waiting",
      message:
        loginStatus === 2
          ? "已扫码，请在手机上确认登录……"
          : "等待扫码……",
    };
    await delay(1800);
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanup() {
  exiting = true;
  qrServer?.close();
  if (apiProcess && apiProcess.exitCode === null) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(apiProcess.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      apiProcess.kill("SIGTERM");
    }
  }
}

process.once("SIGINT", () => {
  void cleanup().finally(() => process.exit(130));
});
process.once("SIGTERM", () => {
  void cleanup().finally(() => process.exit(143));
});

try {
  log("将启动本机扫码助手，并在本机运行固定版本的开源 KuGouMusicApi。");
  log("登录凭证只保存到当前项目的 .env.local；不会显示在页面或发送给网站。");
  await ensureCommunityApi();
  state = { status: "starting", message: "等待本地登录服务启动……" };
  await waitForApi();
  const keyResponse = await requestApi("/login/qr/key");
  qrKey = findValue(keyResponse, ["key", "qrcode", "unikey"]);
  if (!qrKey) throw new Error("社区 API 没有返回二维码 key。");
  await startQrServer();
  state = { status: "waiting", message: "等待扫码……" };
  log(`本机二维码页面：${qrUrl}`);
  await openBrowser();
  log("二维码已在浏览器打开。请使用酷狗概念版扫码并确认登录。");
  await pollLogin();
  await delay(15_000);
} catch (error) {
  state = {
    status: "error",
    message: error instanceof Error ? error.message : "扫码登录失败。",
  };
  log(`扫码助手失败：${state.message}`);
  log("可关闭此终端后重试；登录凭证不会输出到终端。");
  process.exitCode = 1;
} finally {
  await cleanup();
}
