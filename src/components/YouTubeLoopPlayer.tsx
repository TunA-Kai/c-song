import { useEffect, useRef } from "react";

type Props = {
  videoId: string;
  loopEnabled: boolean;
  loopStart?: number;
  loopEnd?: number;
  title: string;
};

type YtPlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YtPlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => YtPlayerState;
  loadVideoById: (options: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
};

type YtApi = {
  Player: new (
    element: HTMLDivElement,
    config: {
      width: string;
      height: string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: YtPlayerState }) => void;
      };
    },
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YtApi> | null = null;

function loadYoutubeApi(): Promise<YtApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YtApi>((resolve, reject) => {
    const existing = document.getElementById("youtube-iframe-api");
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube API loaded without Player."));
      }
    };

    if (!existing) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => reject(new Error("Failed to load YouTube API."));
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export default function YouTubeLoopPlayer({
  videoId,
  loopEnabled,
  loopStart,
  loopEnd,
  title,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const videoIdRef = useRef(videoId);
  const loopEnabledRef = useRef(loopEnabled);
  const loopStartRef = useRef(loopStart);
  const loopEndRef = useRef(loopEnd);

  useEffect(() => {
    videoIdRef.current = videoId;
    loopEnabledRef.current = loopEnabled;
    loopStartRef.current = loopStart;
    loopEndRef.current = loopEnd;
  }, [videoId, loopEnabled, loopStart, loopEnd]);

  useEffect(() => {
    let disposed = false;

    loadYoutubeApi()
      .then((YT) => {
        if (disposed || !containerRef.current) {
          return;
        }

        const player = new YT.Player(containerRef.current, {
          width: "100%",
          height: "100%",
          videoId: videoIdRef.current,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              const currentVideoId = videoIdRef.current;
              const enabled = loopEnabledRef.current;
              const start = loopStartRef.current;
              const end = loopEndRef.current;

              if (
                enabled &&
                typeof start === "number" &&
                typeof end === "number"
              ) {
                player.loadVideoById({
                  videoId: currentVideoId,
                  startSeconds: start,
                  endSeconds: end,
                });
                return;
              }

              player.loadVideoById({
                videoId: currentVideoId,
              });
            },
            onStateChange: (event) => {
              const enabled = loopEnabledRef.current;
              const start = loopStartRef.current;
              const end = loopEndRef.current;

              if (
                event.data === 0 &&
                enabled &&
                typeof start === "number" &&
                typeof end === "number"
              ) {
                player.seekTo(start, true);
                player.playVideo();
              }
            },
          },
        });

        playerRef.current = player;
      })
      .catch(() => {
        // Keep UI stable if API fails to load.
      });

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (
      loopEnabled &&
      typeof loopStart === "number" &&
      typeof loopEnd === "number"
    ) {
      player.loadVideoById({
        videoId,
        startSeconds: loopStart,
        endSeconds: loopEnd,
      });
      return;
    }

    player.loadVideoById({ videoId });
  }, [videoId, loopEnabled, loopStart, loopEnd]);

  useEffect(() => {
    if (
      !(
        loopEnabled &&
        typeof loopStart === "number" &&
        typeof loopEnd === "number"
      )
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const state = player.getPlayerState();
      if (state !== 1 && state !== 0 && state !== 2) {
        return;
      }

      const time = player.getCurrentTime();
      if (time >= loopEnd - 0.05) {
        player.seekTo(loopStart, true);
        player.playVideo();
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [loopEnabled, loopStart, loopEnd]);

  return (
    <div
      ref={containerRef}
      className="youtube-player-host"
      title={title}
      aria-label={title}
    />
  );
}
