import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { songs } from "./data/songs";
import type { Song } from "./models/song";
import Flashcards from "./components/Flashcards";

const STORAGE_KEY = "recent-song-id";

function toEmbedUrl(youtubeUrl?: string): string | undefined {
  if (!youtubeUrl) {
    return undefined;
  }

  try {
    const url = new URL(youtubeUrl);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : undefined;
    }

    if (url.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
    }

    const embed = url.pathname.match(/\/embed\/([^/?]+)/);
    return embed ? `https://www.youtube.com/embed/${embed[1]}` : undefined;
  } catch {
    return undefined;
  }
}

function App() {
  const initialRecent =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const [selectedSongId, setSelectedSongId] = useState<string>(
    initialRecent ?? songs[0]?.id ?? "",
  );
  const [selectedLineId, setSelectedLineId] = useState<number>(1);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [practiceType, setPracticeType] = useState<string | null>(null);

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
    if (!selectedSong) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, selectedSong.id);
    setSelectedLineId(selectedSong.lines[0]?.id ?? 1);
  }, [selectedSong?.id]);

  const embedUrl = toEmbedUrl(selectedSong?.youtubeUrl);

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
            onChange={(event) => setSelectedSongId(event.target.value)}
          >
            {orderedSongs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}
              </option>
            ))}
          </select>
        </div>

        <div className="video-box">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`YouTube player for ${selectedSong?.title ?? "song"}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <p className="empty">No YouTube URL found for this song.</p>
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
