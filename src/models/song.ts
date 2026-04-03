export type VocabularyItem = {
  term: string;
  pinyin?: string;
  level?: string;
  meaning: string;
};

export type SongLine = {
  id: number;
  lyric: string;
  pinyin?: string;
  translation?: string;
  vocabulary: VocabularyItem[];
  grammar?: string;
  note?: string;
  tone?: string;
  culture?: string;
  toneStyle?: string;
};

export type Song = {
  id: string;
  title: string;
  vietnameseTitle?: string;
  youtubeUrl?: string;
  lines: SongLine[];
  analysis?: string;
};
