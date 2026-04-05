import { useEffect, useMemo, useState } from "react";
import { songs } from "./data/songs";
import type { Song } from "./models/song";
import Flashcards from "./components/Flashcards";
import YouTubeLoopPlayer from "./components/YouTubeLoopPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "recent-song-id";

function extractYoutubeVideoId(youtubeUrl?: string): string | undefined {
  if (!youtubeUrl) {
    return undefined;
  }

  try {
    const url = new URL(youtubeUrl);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id || undefined;
    }

    if (url.searchParams.get("v")) {
      return url.searchParams.get("v") ?? undefined;
    }

    const embed = url.pathname.match(/\/embed\/([^/?]+)/);
    return embed ? embed[1] : undefined;
  } catch {
    return undefined;
  }
}

function parseTimeInput(value: string): number | undefined {
  const cleaned = value.trim();
  if (!cleaned) {
    return undefined;
  }

  if (/^\d+$/.test(cleaned)) {
    return Number(cleaned);
  }

  const parts = cleaned.split(":").map((part) => part.trim());
  if (parts.some((part) => !/^\d+$/.test(part))) {
    return undefined;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return undefined;
}

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function App() {
  const initialRecent =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const initialSong =
    songs.find((song) => song.id === (initialRecent ?? "")) ?? songs[0];
  const [selectedSongId, setSelectedSongId] = useState<string>(
    initialSong?.id ?? "",
  );
  const [selectedLineId, setSelectedLineId] = useState<number>(
    initialSong?.lines[0]?.id ?? 1,
  );
  const [showPinyin, setShowPinyin] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [practiceType, setPracticeType] = useState<string | null>(null);
  const [loopStartInput, setLoopStartInput] = useState("1:30");
  const [loopEndInput, setLoopEndInput] = useState("2:30");
  const [appliedLoop, setAppliedLoop] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [loopError, setLoopError] = useState<string | null>(null);

  const selectedSong = useMemo<Song | undefined>(
    () => songs.find((song) => song.id === selectedSongId) ?? songs[0],
    [selectedSongId],
  );

  const orderedSongs = useMemo(() => {
    if (!initialRecent) {
      return songs;
    }
    const recent = songs.find((song) => song.id === initialRecent);
    if (!recent) {
      return songs;
    }
    return [recent, ...songs.filter((song) => song.id !== recent.id)];
  }, [initialRecent]);

  const selectedLine = useMemo(
    () =>
      selectedSong?.lines.find((line) => line.id === selectedLineId) ??
      selectedSong?.lines[0],
    [selectedSong, selectedLineId],
  );

  useEffect(() => {
    if (!selectedSongId) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, selectedSongId);
  }, [selectedSongId]);

  const videoId = extractYoutubeVideoId(selectedSong?.youtubeUrl);
  const loopStart = parseTimeInput(loopStartInput);
  const loopEnd = parseTimeInput(loopEndInput);
  const isLoopApplied = appliedLoop !== null;

  function applyLoop() {
    if (typeof loopStart !== "number" || typeof loopEnd !== "number") {
      setLoopError("Time format is invalid. Use mm:ss, hh:mm:ss, or seconds.");
      return;
    }
    if (loopStart >= loopEnd) {
      setLoopError("Start time must be earlier than end time.");
      return;
    }
    setLoopError(null);
    setAppliedLoop({ start: loopStart, end: loopEnd });
  }

  function clearLoop() {
    setAppliedLoop(null);
    setLoopError(null);
  }

  function handleSongChange(nextSongId: string) {
    setSelectedSongId(nextSongId);
    const nextSong = songs.find((song) => song.id === nextSongId);
    setSelectedLineId(nextSong?.lines[0]?.id ?? 1);
    setAppliedLoop(null);
    setLoopError(null);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.25fr]">
      <section className="border-b border-border p-5 lg:border-r lg:border-b-0">
        <h1 className="m-0 text-[34px] font-semibold text-(--text-h)">
          Chinese by Song
        </h1>
        <p className="mb-5 mt-2 text-sm text-(--text)">
          Luyện tiếng Trung qua bài hát • Vietnamese support
        </p>

        <div className="mb-4 flex flex-col gap-2">
          <Label htmlFor="song-select">Recent practice first</Label>
          <select
            id="song-select"
            className="rounded-lg border border-border bg-(--bg) px-3 py-2.5 text-sm text-(--text-h)"
            value={selectedSong?.id ?? ""}
            onChange={(event) => handleSongChange(event.target.value)}
          >
            {orderedSongs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-(--social-bg)">
          {videoId ? (
            <YouTubeLoopPlayer
              videoId={videoId}
              loopEnabled={isLoopApplied}
              loopStart={appliedLoop?.start}
              loopEnd={appliedLoop?.end}
              title={`YouTube player for ${selectedSong?.title ?? "song"}`}
            />
          ) : (
            <p className="p-3 text-sm text-(--text)">
              No YouTube URL found for this song.
            </p>
          )}
        </div>

        <div className="mt-3 rounded-[10px] border border-border bg-(--social-bg) p-2.5">
          <h3 className="mb-2 text-[15px] font-semibold text-(--text-h)">
            Loop a segment (A-B repeat)
          </h3>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applyLoop();
            }}
          >
            <label className="flex flex-col gap-1 text-xs text-(--text)">
              Start
              <Input
                className="w-22.5"
                value={loopStartInput}
                onChange={(event) => setLoopStartInput(event.target.value)}
                placeholder="1:30"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-(--text)">
              End
              <Input
                className="w-22.5"
                value={loopEndInput}
                onChange={(event) => setLoopEndInput(event.target.value)}
                placeholder="2:30"
              />
            </label>
            <Button type="submit">Apply loop</Button>
            <Button type="button" variant="outline" onClick={clearLoop}>
              Clear
            </Button>
          </form>
          {loopError ? (
            <p className="mt-2 text-xs text-[#ff7b7b]">{loopError}</p>
          ) : isLoopApplied && appliedLoop ? (
            <p className="mt-2 text-xs text-(--text)">
              Looping {formatSeconds(appliedLoop.start)} to{" "}
              {formatSeconds(appliedLoop.end)}.
            </p>
          ) : (
            <p className="mt-2 text-xs text-(--text)">
              Set a start/end, then press Apply loop to replay that section.
            </p>
          )}
        </div>

        <div className="mt-3 max-w-130">
          <h3 className="my-2 text-base font-semibold text-(--text-h)">
            Practice
          </h3>
          <p className="mb-2.5 text-sm text-(--text)">
            Choose an exercise to practice this song.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPracticeType("flashcards")}>
              Flashcards
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPracticeType("gapfill")}
            >
              Gap-fill
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPracticeType("karaoke")}
            >
              Karaoke
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPracticeType("pronunciation")}
            >
              Pronunciation
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPracticeType("vocab")}
            >
              Vocabulary
            </Button>
          </div>
        </div>

        {selectedSong?.analysis && (
          <div className="mt-3.5">
            <Button
              variant="outline"
              className={`w-full justify-start px-3.5 py-2.5 text-left text-sm ${showAnalysis ? "border-accent bg-(--accent-bg) text-(--text-h)" : ""}`}
              onClick={() => setShowAnalysis((v) => !v)}
            >
              {showAnalysis
                ? "Ẩn phân tích ý nghĩa ▲"
                : "Xem phân tích ý nghĩa ▼"}
            </Button>

            {showAnalysis && (
              <div className="mt-2.5 grid gap-2.5 rounded-[10px] border border-border bg-(--social-bg) p-3">
                {selectedSong.analysis.split(/\n{2,}/).map((para, i) => (
                  <p
                    key={i}
                    className="m-0 text-sm leading-[1.7] text-(--text-h)"
                  >
                    {para.trim()}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="p-5">
        <div className="mb-3 flex gap-2">
          <Button
            variant={showPinyin ? "default" : "outline"}
            className={
              showPinyin ? "border-accent bg-(--accent-bg) text-(--text-h)" : ""
            }
            onClick={() => setShowPinyin((value) => !value)}
          >
            {showPinyin ? "Hide pinyin" : "Show pinyin"}
          </Button>
        </div>

        <div className="grid max-h-[48vh] gap-2.5 overflow-auto pr-1">
          {selectedSong?.lines.map((line) => {
            const isActive = line.id === selectedLine?.id;
            return (
              <article
                key={line.id}
                className={`cursor-pointer rounded-[10px] border p-2.5 text-left transition-colors ${isActive ? "border-accent bg-(--accent-bg)" : "border-border"}`}
                onClick={() => setSelectedLineId(line.id)}
              >
                <header className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--social-bg) px-1 text-xs">
                    {line.id}
                  </span>
                  <span className="text-[32px] leading-[1.2] font-medium text-(--text-h)">
                    {line.lyric}
                  </span>
                  <span className="group/tooltip relative ml-auto">
                    <span className="rounded-full border border-(--accent-border) px-2 py-0.5 text-xs">
                      Dịch
                    </span>
                    <span className="pointer-events-none absolute right-0 top-[120%] z-5 w-65 rounded-lg border border-border bg-(--bg) p-2 text-xs text-(--text-h) opacity-0 shadow-(--shadow) transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
                      {line.translation ?? "Chưa có bản dịch."}
                    </span>
                  </span>
                </header>
                {showPinyin && line.pinyin && (
                  <p className="mt-2 text-sm text-(--text)">{line.pinyin}</p>
                )}
              </article>
            );
          })}
        </div>

        <section className="mt-4 border-t border-border pt-4 text-left">
          <h2 className="mb-2.5 text-xl font-semibold text-(--text-h)">
            New words by phrase
          </h2>
          {selectedLine && selectedLine.vocabulary.length > 0 ? (
            <div className="grid max-h-[32vh] gap-2.5 overflow-auto pr-1">
              <article className="rounded-[10px] border border-border bg-(--social-bg) p-2.5">
                <h3 className="mb-2 text-base font-semibold text-(--text-h)">
                  {selectedLine.id}) {selectedLine.lyric}
                </h3>
                <ul className="m-0 list-disc pl-5">
                  {selectedLine.vocabulary.map((item, index) => (
                    <li key={`${item.term}-${index}`} className="mb-1 text-sm">
                      <a
                        href={`https://hanzii.net/search/word/${encodeURIComponent(item.term)}?hl=vi`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold no-underline hover:underline"
                      >
                        {item.term}
                      </a>
                      <span className="text-(--text)">
                        {item.pinyin ? ` (${item.pinyin})` : ""}
                      </span>
                      <span className="text-(--text)"> — {item.meaning}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <p className="p-3 text-sm text-(--text)">
              No vocabulary found for the selected sentence.
            </p>
          )}
        </section>

        {practiceType === "flashcards" && selectedSong && (
          <Flashcards
            key={selectedSong.id}
            vocab={selectedSong.lines.flatMap((l) => l.vocabulary)}
            songId={selectedSong.id}
            onClose={() => setPracticeType(null)}
          />
        )}

        {practiceType && practiceType !== "flashcards" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45"
            onClick={() => setPracticeType(null)}
          >
            <div
              className="flex max-h-[86vh] w-[min(920px,94vw)] flex-col rounded-xl border border-border bg-(--bg) p-4.5 shadow-(--shadow)"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between gap-3">
                <h2 className="m-0 text-xl font-semibold text-(--text-h)">
                  {practiceType.charAt(0).toUpperCase() + practiceType.slice(1)}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPracticeType(null)}
                  >
                    Close
                  </Button>
                </div>
              </header>
              <div className="p-10 text-center text-(--text)">
                This practice type is a placeholder. I can implement it next.
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
