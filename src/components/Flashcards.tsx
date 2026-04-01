import { useEffect, useMemo, useState } from "react";
import type { VocabularyItem } from "../models/song";

type Props = {
  vocab: VocabularyItem[];
  songId: string;
  onClose?: () => void;
};

function deterministicSwapIndex(seed: string, i: number): number {
  let hash = 2166136261;
  for (let k = 0; k < seed.length; k++) {
    hash ^= seed.charCodeAt(k);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= i;
  hash = Math.imul(hash, 16777619);
  return Math.abs(hash) % (i + 1);
}

export default function Flashcards({ vocab, songId, onClose }: Props) {
  const STORAGE_KEY = `flashcards-known-${songId}`;
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [known, setKnown] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const [shuffled, setShuffled] = useState(false);
  const [showPinyin, setShowPinyin] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const raw = localStorage.getItem(`flashcards-show-pinyin-${songId}`);
    return raw === null ? true : raw === "1";
  });
  const [showRef, setShowRef] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    const raw = localStorage.getItem(`flashcards-show-ref-${songId}`);
    return raw === null ? true : raw === "1";
  });

  useEffect(() => {
    const key = `flashcards-show-pinyin-${songId}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, showPinyin ? "1" : "0");
    }
  }, [showPinyin, songId]);

  useEffect(() => {
    const key = `flashcards-show-ref-${songId}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, showRef ? "1" : "0");
    }
  }, [showRef, songId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(known));
    }
  }, [known, STORAGE_KEY]);

  const deck = useMemo(() => {
    const items = vocab.map((v, i) => ({ ...v, _id: `${v.term}-${i}` }));
    if (shuffled) {
      const seed = `${songId}-${vocab.length}`;
      for (let i = items.length - 1; i > 0; i--) {
        const j = deterministicSwapIndex(seed, i);
        [items[i], items[j]] = [items[j], items[i]];
      }
    }
    return items;
  }, [vocab, shuffled, songId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(i + 1, deck.length - 1));
        setShowBack(false);
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
        setShowBack(false);
      } else if (e.key === " ") {
        e.preventDefault();
        setShowBack((s) => !s);
      } else if (e.key.toLowerCase() === "k") {
        const active = deck[index];
        if (active) {
          const id = `${active.term}-${index}`;
          setKnown((k) => ({ ...k, [id]: !k[id] }));
        }
      } else if (e.key === "Escape") {
        if (onClose) onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, index, onClose]);

  if (!vocab || vocab.length === 0) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-shell">
          <header className="flash-header">
            <h2>Flashcards</h2>
            <div className="flash-actions">
              <button onClick={onClose}>Close</button>
            </div>
          </header>
          <div className="flash-empty">
            No vocabulary available for this song.
          </div>
        </div>
      </div>
    );
  }

  const current = deck[index];
  const currentId = `${current.term}-${index}`;

  function next() {
    setShowBack(false);
    setIndex((i) => Math.min(i + 1, deck.length - 1));
  }

  function prev() {
    setShowBack(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  function toggleKnown(id: string) {
    setKnown((k) => ({ ...k, [id]: !k[id] }));
  }

  function resetKnown() {
    setKnown({});
  }

  return (
    <div className="flashcards-page">
      <div className="flashcards-shell">
        <header className="flash-header">
          <h2>Flashcards — {vocab.length} cards</h2>
          <div className="flash-actions">
            <button onClick={() => setShuffled((s) => !s)}>
              {shuffled ? "Unshuffle" : "Shuffle"}
            </button>
            <button onClick={resetKnown}>Reset known</button>
            <button onClick={() => setShowPinyin((s) => !s)}>
              {showPinyin ? "Hide pinyin" : "Show pinyin"}
            </button>
            <button onClick={() => setShowRef((s) => !s)}>
              {showRef ? "Hide ref" : "Show ref"}
            </button>
            <button onClick={onClose}>Close</button>
          </div>
        </header>

        <main className="flash-main">
          <div className={`flash-card ${showBack ? "back" : "front"}`}>
            <div className="flash-card-inner">
              {!showBack ? (
                <>
                  {showRef ? (
                    <a
                      className="term-link"
                      href={`https://hanzii.net/search/word/${encodeURIComponent(
                        current.term,
                      )}?hl=vi`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="term-large">{current.term}</div>
                    </a>
                  ) : (
                    <div className="term-large">{current.term}</div>
                  )}
                  {showPinyin && (
                    <div className="pinyin-small">{current.pinyin ?? ""}</div>
                  )}
                </>
              ) : (
                <>
                  {showRef ? (
                    <a
                      className="term-link"
                      href={`https://hanzii.net/search/word/${encodeURIComponent(
                        current.term,
                      )}?hl=vi`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="term-large">{current.term}</div>
                    </a>
                  ) : (
                    <div className="term-large">{current.term}</div>
                  )}
                  {showPinyin && (
                    <div className="pinyin-small">{current.pinyin ?? ""}</div>
                  )}
                  <div className="meaning-large">{current.meaning}</div>
                </>
              )}
            </div>
          </div>

          <div className="flash-controls-bar">
            <button onClick={prev} disabled={index === 0} className="ghost">
              ◀ Prev
            </button>
            <button onClick={() => setShowBack((s) => !s)} className="primary">
              {showBack ? "Hide" : "Show answer"}
            </button>
            <button
              onClick={next}
              disabled={index >= deck.length - 1}
              className="ghost"
            >
              Next ▶
            </button>
          </div>

          <div className="flash-meta">
            <span className="count">
              {index + 1}/{deck.length}
            </span>
            <button
              onClick={() => toggleKnown(currentId)}
              className="mark-known"
            >
              {known[currentId] ? "Unmark known" : "Mark known"}
            </button>
            {known[currentId] && <span className="known-chip">Known</span>}
          </div>
        </main>
      </div>
    </div>
  );
}
