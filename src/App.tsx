import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { songs } from "./data/songs";
import type { Song } from "./models/song";
import Flashcards from "./components/Flashcards";
import YouTubeLoopPlayer from "./components/YouTubeLoopPlayer";

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
    <main className="layout">
      <section className="left-panel">
        <h1>Chinese by Song</h1>
        <p className="subtitle">
          Luyện tiếng Trung qua bài hát • Vietnamese support
        </p>

        <div className="song-picker">
          <label htmlFor="song-select">Recent practice first</label>
          <select
            id="song-select"
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

        <div className="video-box">
          {videoId ? (
            <YouTubeLoopPlayer
              videoId={videoId}
              loopEnabled={isLoopApplied}
              loopStart={appliedLoop?.start}
              loopEnd={appliedLoop?.end}
              title={`YouTube player for ${selectedSong?.title ?? "song"}`}
            />
          ) : (
            <p className="empty">No YouTube URL found for this song.</p>
          )}
        </div>

        <div className="loop-panel">
          <h3>Loop a segment (A-B repeat)</h3>
          <form
            className="loop-controls"
            onSubmit={(event) => {
              event.preventDefault();
              applyLoop();
            }}
          >
            <label>
              Start
              <input
                value={loopStartInput}
                onChange={(event) => setLoopStartInput(event.target.value)}
                placeholder="1:30"
              />
            </label>
            <label>
              End
              <input
                value={loopEndInput}
                onChange={(event) => setLoopEndInput(event.target.value)}
                placeholder="2:30"
              />
            </label>
            <button type="submit">Apply loop</button>
            <button type="button" className="ghost" onClick={clearLoop}>
              Clear
            </button>
          </form>
          {loopError ? (
            <p className="loop-note loop-error">{loopError}</p>
          ) : isLoopApplied && appliedLoop ? (
            <p className="loop-note">
              Looping {formatSeconds(appliedLoop.start)} to{" "}
              {formatSeconds(appliedLoop.end)}.
            </p>
          ) : (
            <p className="loop-note">
              Set a start/end, then press Apply loop to replay that section.
            </p>
          )}
        </div>

        <div className="practice-overview">
          <h3>Practice</h3>
          <p className="practice-desc">
            Choose an exercise to practice this song.
          </p>
          <div className="practice-buttons">
            <button onClick={() => setPracticeType("flashcards")}>
              Flashcards
            </button>
            <button onClick={() => setPracticeType("gapfill")}>Gap-fill</button>
            <button onClick={() => setPracticeType("karaoke")}>Karaoke</button>
            <button onClick={() => setPracticeType("pronunciation")}>
              Pronunciation
            </button>
            <button onClick={() => setPracticeType("vocab")}>Vocabulary</button>
          </div>
        </div>

        {selectedSong?.analysis && (
          <div className="analysis-section">
            <button
              className={`analysis-toggle ${showAnalysis ? "active" : ""}`}
              onClick={() => setShowAnalysis((v) => !v)}
            >
              {showAnalysis
                ? "Ẩn phân tích ý nghĩa ▲"
                : "Xem phân tích ý nghĩa ▼"}
            </button>

            {showAnalysis && (
              <div className="analysis-body">
                {selectedSong.analysis.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="right-panel">
        <div className="toolbar">
          <button
            className={showPinyin ? "active" : ""}
            onClick={() => setShowPinyin((value) => !value)}
          >
            {showPinyin ? "Hide pinyin" : "Show pinyin"}
          </button>
        </div>

        <div className="lyrics-list">
          {selectedSong?.lines.map((line) => {
            const isActive = line.id === selectedLine?.id;
            return (
              <article
                key={line.id}
                className={`line-card ${isActive ? "line-active" : ""}`}
                onClick={() => setSelectedLineId(line.id)}
              >
                <header>
                  <span className="line-index">{line.id}</span>
                  <span className="line-lyric">{line.lyric}</span>
                  <span className="translation-tooltip">
                    <span className="translation-badge">Dịch</span>
                    <span className="translation-text">
                      {line.translation ?? "Chưa có bản dịch."}
                    </span>
                  </span>
                </header>
                {showPinyin && line.pinyin && (
                  <p className="line-pinyin">{line.pinyin}</p>
                )}
              </article>
            );
          })}
        </div>

        <section className="practice-area">
          <h2>New words by phrase</h2>
          {selectedLine && selectedLine.vocabulary.length > 0 ? (
            <div className="phrase-vocab-list">
              <article className="phrase-vocab-card">
                <h3>
                  {selectedLine.id}) {selectedLine.lyric}
                </h3>
                <ul>
                  {selectedLine.vocabulary.map((item, index) => (
                    <li key={`${item.term}-${index}`}>
                      <span className="term">{item.term}</span>
                      <span className="detail">
                        {item.pinyin ? ` (${item.pinyin})` : ""}
                      </span>
                      <span className="detail"> — {item.meaning}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <p className="empty">
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
            className="flashcards-page"
            onClick={() => setPracticeType(null)}
          >
            <div
              className="flashcards-shell"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flash-header">
                <h2>
                  {practiceType.charAt(0).toUpperCase() + practiceType.slice(1)}
                </h2>
                <div className="flash-actions">
                  <button onClick={() => setPracticeType(null)}>Close</button>
                </div>
              </header>
              <div className="flash-empty">
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
