import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
        <div className="flex max-h-[86vh] w-[min(920px,94vw)] flex-col rounded-xl border border-border bg-(--bg) p-4.5 shadow-(--shadow)">
          <header className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-semibold text-(--text-h)">
              Flashcards
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </header>
          <div className="p-10 text-center text-(--text)">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
      <div className="flex max-h-[86vh] w-[min(920px,94vw)] flex-col rounded-xl border border-border bg-(--bg) p-4.5 shadow-(--shadow)">
        <header className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-semibold text-(--text-h)">
            Flashcards — {vocab.length} cards
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShuffled((s) => !s)}>
              {shuffled ? "Unshuffle" : "Shuffle"}
            </Button>
            <Button variant="outline" onClick={resetKnown}>
              Reset known
            </Button>
            <Button variant="outline" onClick={() => setShowPinyin((s) => !s)}>
              {showPinyin ? "Hide pinyin" : "Show pinyin"}
            </Button>
            <Button variant="outline" onClick={() => setShowRef((s) => !s)}>
              {showRef ? "Hide ref" : "Show ref"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>

        <main className="mt-3.5 grid items-center gap-3">
          <div className="flex min-h-80 items-center justify-center rounded-xl border border-border bg-linear-to-b from-(--social-bg) to-(--bg) p-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            <div className="px-5 py-5 text-center">
              {!showBack ? (
                <>
                  {showRef ? (
                    <a
                      className="inline-block cursor-pointer text-decoration-none"
                      href={`https://hanzii.net/search/word/${encodeURIComponent(
                        current.term,
                      )}?hl=vi`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="mb-2 inline-block text-5xl font-bold text-accent">
                        {current.term}
                      </div>
                    </a>
                  ) : (
                    <div className="text-5xl font-bold text-(--text-h)">
                      {current.term}
                    </div>
                  )}
                  {showPinyin && (
                    <div className="mt-3 text-(--text)">
                      {current.pinyin ?? ""}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {showRef ? (
                    <a
                      className="inline-block cursor-pointer text-decoration-none"
                      href={`https://hanzii.net/search/word/${encodeURIComponent(
                        current.term,
                      )}?hl=vi`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="mb-2 inline-block text-5xl font-bold text-accent">
                        {current.term}
                      </div>
                    </a>
                  ) : (
                    <div className="text-5xl font-bold text-(--text-h)">
                      {current.term}
                    </div>
                  )}
                  {showPinyin && (
                    <div className="mt-3 text-(--text)">
                      {current.pinyin ?? ""}
                    </div>
                  )}
                  <div className="mt-3.5 text-lg text-(--text-h)">
                    {current.meaning}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={prev} disabled={index === 0} variant="outline">
              ◀ Prev
            </Button>
            <Button onClick={() => setShowBack((s) => !s)}>
              {showBack ? "Hide" : "Show answer"}
            </Button>
            <Button
              onClick={next}
              disabled={index >= deck.length - 1}
              variant="outline"
            >
              Next ▶
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <span className="text-sm text-(--text)">
              {index + 1}/{deck.length}
            </span>
            <Button onClick={() => toggleKnown(currentId)} variant="outline">
              {known[currentId] ? "Unmark known" : "Mark known"}
            </Button>
            {known[currentId] && (
              <span className="rounded-full bg-[#e6ffea] px-2 py-1 text-sm font-semibold text-[#04662b]">
                Known
              </span>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
