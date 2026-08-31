
// hooks/useLanyard.ts

"use client";

import { useEffect, useState } from "react";


/* ============================================================
 * Discord
 * ============================================================ */

const DISCORD_ID =
  "1339668386522726492";


/* ============================================================
 * 类型
 * ============================================================ */

export interface LanyardStatus {
  isOnline: boolean;

  status:
    | "online"
    | "idle"
    | "dnd"
    | "offline";

  appName: string;

  details: string;

  largeImage: string | null;

  isListeningMusic: boolean;
}


/* ============================================================
 * Discord Activity 图片解析
 *
 * 支持：
 *
 * 1. mp:external/...
 * 2. http://...
 * 3. https://...
 * 4. Discord Application Asset
 * ============================================================ */

function resolveActivityImage(
  activity: any
): string | null {
  const largeImage =
    activity?.assets?.large_image;


  if (
    !largeImage ||
    typeof largeImage !==
      "string"
  ) {
    return null;
  }


  /* ==========================================================
   * 1. Discord 外部图片
   *
   * 例如：
   *
   * mp:external/xxxx/https/example.com/image.png
   * ========================================================== */

  if (
    largeImage.startsWith(
      "mp:external/"
    )
  ) {
    const match =
      largeImage.match(
        /^mp:external\/[^/]+\/(https?):\/\/(.+)$/
      );


    if (match) {
      return `${match[1]}://${match[2]}`;
    }


    return null;
  }


  /* ==========================================================
   * 2. 本身已经是完整 URL
   * ========================================================== */

  if (
    largeImage.startsWith(
      "http://"
    ) ||
    largeImage.startsWith(
      "https://"
    )
  ) {
    return largeImage;
  }


  /* ==========================================================
   * 3. Discord Application Asset
   *
   * 例如：
   *
   * application_id:
   * 383226320970055681
   *
   * large_image:
   * 1359299427059236984
   *
   * 最终：
   *
   * https://cdn.discordapp.com/
   * app-assets/
   * 383226320970055681/
   * 1359299427059236984.png
   * ========================================================== */

  if (
    activity?.application_id
  ) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImage}.png`;
  }


  return null;
}


/* ============================================================
 * 创建默认状态
 * ============================================================ */

function createOfflineState(): LanyardStatus {
  return {
    isOnline: false,

    status: "offline",

    appName: "Desktop",

    details: "离线",

    largeImage: null,

    isListeningMusic: false,
  };
}


/* ============================================================
 * 判断 Activity 是否为可显示的主要 Activity
 * ============================================================ */

function isDisplayableActivity(
  activity: any
): boolean {
  if (!activity) {
    return false;
  }


  return (
    activity.type === 0 ||
    activity.type === 2
  );
}


/* ============================================================
 * 选择最合适的 Discord Activity
 *
 * 优先级：
 *
 * 1. type 0 且有图片
 * 2. type 2 且有图片
 * 3. type 0
 * 4. type 2
 *
 * 这样可以避免：
 *
 * 第一个 Activity 没图
 * ↓
 * 后面的 VS Code / 游戏明明有图却没被选中
 * ============================================================ */

function selectActivity(
  activities: any[]
): any | null {
  const usableActivities =
    activities.filter(
      isDisplayableActivity
    );


  if (
    usableActivities.length ===
    0
  ) {
    return null;
  }


  /* ----------------------------------------------------------
   * 第一优先：Playing + 有图片
   * ---------------------------------------------------------- */

  const playingWithImage =
    usableActivities.find(
      (
        activity
      ) =>
        activity.type === 0 &&
        Boolean(
          resolveActivityImage(
            activity
          )
        )
    );


  if (
    playingWithImage
  ) {
    return playingWithImage;
  }


  /* ----------------------------------------------------------
   * 第二优先：Listening + 有图片
   * ---------------------------------------------------------- */

  const listeningWithImage =
    usableActivities.find(
      (
        activity
      ) =>
        activity.type === 2 &&
        Boolean(
          resolveActivityImage(
            activity
          )
        )
    );


  if (
    listeningWithImage
  ) {
    return listeningWithImage;
  }


  /* ----------------------------------------------------------
   * 第三优先：普通 Playing
   * ---------------------------------------------------------- */

  const playing =
    usableActivities.find(
      (
        activity
      ) =>
        activity.type === 0
    );


  if (
    playing
  ) {
    return playing;
  }


  /* ----------------------------------------------------------
   * 第四优先：普通 Listening
   * ---------------------------------------------------------- */

  return (
    usableActivities.find(
      (
        activity
      ) =>
        activity.type === 2
    ) || null
  );
}


/* ============================================================
 * Hook
 * ============================================================ */

export function useLanyard() {
  const [
    data,
    setData,
  ] = useState<LanyardStatus>(
    createOfflineState()
  );


  useEffect(() => {
    let ws:
      | WebSocket
      | null = null;


    let heartbeat:
      | ReturnType<
          typeof setInterval
        >
      | null = null;


    let reconnectTimer:
      | ReturnType<
          typeof setTimeout
        >
      | null = null;


    let stopped = false;


    /* ========================================================
     * 清理
     * ======================================================== */

    const cleanupSocket =
      () => {
        if (heartbeat) {
          clearInterval(
            heartbeat
          );

          heartbeat = null;
        }


        if (ws) {
          ws.close();

          ws = null;
        }
      };


    /* ========================================================
     * 重连
     * ======================================================== */

    const scheduleReconnect =
      () => {
        if (
          stopped ||
          reconnectTimer
        ) {
          return;
        }


        reconnectTimer =
          setTimeout(() => {
            reconnectTimer =
              null;

            initSocket();
          }, 5000);
      };


    /* ========================================================
     * 初始化
     * ======================================================== */

    const initSocket =
      () => {
        if (stopped) {
          return;
        }


        /*
         * 防止重复连接
         */

        if (
          ws &&
          (
            ws.readyState ===
              WebSocket.OPEN ||
            ws.readyState ===
              WebSocket.CONNECTING
          )
        ) {
          return;
        }


        cleanupSocket();


        try {
          ws =
            new WebSocket(
              "wss://api.lanyard.rest/socket"
            );
        } catch {
          scheduleReconnect();
          return;
        }


        /* ====================================================
         * WebSocket 打开
         * ==================================================== */

        ws.onopen =
          () => {
            /*
             * 等待 Lanyard HELLO
             */
          };


        /* ====================================================
         * WebSocket 消息
         * ==================================================== */

        ws.onmessage =
          (
            event
          ) => {
            let msg: any;


            try {
              msg =
                JSON.parse(
                  event.data
                );
            } catch {
              return;
            }


            /* ==================================================
             * 1. Lanyard HELLO
             * ================================================== */

            if (
              msg.op === 1
            ) {
              /*
               * 建立心跳
               */

              if (
                heartbeat
              ) {
                clearInterval(
                  heartbeat
                );
              }


              heartbeat =
                setInterval(
                  () => {
                    if (
                      ws?.readyState ===
                      WebSocket.OPEN
                    ) {
                      ws.send(
                        JSON.stringify({
                          op: 3,
                        })
                      );
                    }
                  },
                  msg?.d
                    ?.heartbeat_interval ||
                    30000
                );


              /*
               * 订阅用户
               */

              ws?.send(
                JSON.stringify({
                  op: 2,

                  d: {
                    subscribe_to_id:
                      DISCORD_ID,
                  },
                })
              );


              return;
            }


            /* ==================================================
             * 2. 状态更新
             * ================================================== */

            if (
              msg.t !==
                "INIT_STATE" &&
              msg.t !==
                "PRESENCE_UPDATE"
            ) {
              return;
            }


            const d =
              msg.d;


            if (!d) {
              return;
            }


            /* ==================================================
             * Discord 在线状态
             * ================================================== */

            const discordStatus =
              d.discord_status ||
              "offline";


            const isOnline =
              discordStatus !==
              "offline";


            /* ==================================================
             * 3. Spotify
             *
             * Spotify 保留。
             * ================================================== */

            if (
              d.listening_to_spotify &&
              d.spotify
            ) {
              setData({
                isOnline: true,

                status:
                  discordStatus,

                appName:
                  "Spotify",

                details:
                  `${d.spotify.song} - ${d.spotify.artist}`,

                largeImage:
                  d.spotify
                    .album_art_url ||
                  null,

                isListeningMusic:
                  true,
              });


              return;
            }


            /* ==================================================
             * 4. Discord Activities
             * ================================================== */

            const activities =
              Array.isArray(
                d.activities
              )
                ? d.activities
                : [];


            const activity =
              selectActivity(
                activities
              );


            /* ==================================================
             * 5. Activity 存在
             * ================================================== */

            if (
              activity
            ) {
              const imgUrl =
                resolveActivityImage(
                  activity
                );


              const activityName =
                activity.name ||
                "Desktop";


              const activityDetails =
                activity.details ||
                activity.state ||
                "活跃中";


              /*
               * Discord:
               *
               * type 0 = Playing
               * type 2 = Listening
               *
               * 这里保留通用判断，
               * 但不再识别 MoeKoe。
               */

              const isMusicActivity =
                activity.type === 2 ||
                String(
                  activityName
                )
                  .toLowerCase()
                  .includes(
                    "music"
                  );


              setData({
                isOnline,

                status:
                  discordStatus,

                appName:
                  activityName,

                details:
                  activityDetails,

                largeImage:
                  imgUrl,

                isListeningMusic:
                  isMusicActivity,
              });


              return;
            }


            /* ==================================================
             * 6. 在线但没有 Activity
             * ================================================== */

            setData({
              isOnline,

              status:
                discordStatus,

              appName:
                "Desktop",

              details:
                isOnline
                  ? "空闲中"
                  : "离线",

              largeImage:
                null,

              isListeningMusic:
                false,
            });
          };


        /* ======================================================
         * WebSocket 关闭
         * ====================================================== */

        ws.onclose =
          () => {
            if (
              heartbeat
            ) {
              clearInterval(
                heartbeat
              );

              heartbeat =
                null;
            }


            ws = null;


            if (
              !stopped
            ) {
              scheduleReconnect();
            }
          };


        /* ======================================================
         * WebSocket 错误
         * ====================================================== */

        ws.onerror =
          () => {
            /*
             * onerror 后通常会触发 onclose。
             *
             * 因此这里不重复处理。
             */
          };
      };


    /* ========================================================
     * 启动
     * ======================================================== */

    initSocket();


    /* ========================================================
     * Cleanup
     * ======================================================== */

    return () => {
      stopped = true;


      if (
        reconnectTimer
      ) {
        clearTimeout(
          reconnectTimer
        );

        reconnectTimer =
          null;
      }


      cleanupSocket();
    };
  }, []);


  return data;
}

