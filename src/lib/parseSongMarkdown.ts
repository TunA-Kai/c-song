import type { Song, SongLine, VocabularyItem } from '../models/song';

function parseVocabulary(line: string): VocabularyItem | null {
  const cleanLine = line.trim().replace(/^-\s*/, '');
  const fullPattern = /^(.+?)\s*\(([^)]+)\)\s*(?:\[([^\]]+)\])?\s*[—-]\s*(.+)$/;
  const fullMatch = cleanLine.match(fullPattern);
  if (fullMatch) {
    const [, term, pinyin, level, meaning] = fullMatch;
    return {
      term: term.trim(),
      pinyin: pinyin.trim(),
      level: level?.trim(),
      meaning: meaning.trim().replace(/\.$/, ''),
    };
  }

  const fallbackPattern = /^(.+?)\s*[—-]\s*(.+)$/;
  const fallbackMatch = cleanLine.match(fallbackPattern);
  if (!fallbackMatch) {
    return null;
  }

  const [, term, meaning] = fallbackMatch;
  return {
    term: term.trim(),
    meaning: meaning.trim().replace(/\.$/, ''),
  };
}

function extractYoutubeUrl(markdown: string): string | undefined {
  const youtubeMatch = markdown.match(
    /\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)]+)\)/i,
  );
  return youtubeMatch?.[1];
}

function extractTitle(markdown: string, fallbackName: string): string {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const value = titleMatch[1].trim();
    if (value && !value.toLowerCase().includes('song title')) {
      return value;
    }
  }
  return fallbackName;
}

function extractVietnameseTitle(markdown: string): string | undefined {
  const match = markdown.match(/^Vietnamese Title:\s*(.+)$/m);
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

function parseLineBlocks(markdown: string): SongLine[] {
  const rows = markdown.split(/\r?\n/);
  const lines: SongLine[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const header = rows[index].match(/^###\s+(\d+)\)\s*(.+)$/);
    if (!header) {
      continue;
    }

    const lineId = Number(header[1]);
    const lyric = header[2].trim();
    const blockRows: string[] = [];

    let cursor = index + 1;
    while (cursor < rows.length && !rows[cursor].match(/^###\s+\d+\)\s+/)) {
      blockRows.push(rows[cursor]);
      cursor += 1;
    }

    const line: SongLine = {
      id: lineId,
      lyric,
      vocabulary: [],
    };

    let inVocabulary = false;
    for (const row of blockRows) {
      const trimmed = row.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('- Pinyin:')) {
        inVocabulary = false;
        line.pinyin = trimmed.replace('- Pinyin:', '').trim();
        continue;
      }

      if (trimmed.startsWith('- Dịch:')) {
        inVocabulary = false;
        line.translation = trimmed
          .replace('- Dịch:', '')
          .trim()
          .replace(/^"|"$/g, '');
        continue;
      }

      if (trimmed.startsWith('- Từ vựng:')) {
        inVocabulary = true;
        continue;
      }

      if (trimmed.startsWith('- Ngữ pháp:')) {
        inVocabulary = false;
        line.grammar = trimmed.replace('- Ngữ pháp:', '').trim();
        continue;
      }

      if (trimmed.startsWith('- Ghi chú:')) {
        inVocabulary = false;
        line.note = trimmed.replace('- Ghi chú:', '').trim();
        continue;
      }

      if (trimmed.startsWith('- Sắc thái:')) {
        inVocabulary = false;
        line.toneStyle = trimmed.replace('- Sắc thái:', '').trim();
        continue;
      }

      if (trimmed.startsWith('- Thanh điệu:')) {
        inVocabulary = false;
        line.tone = trimmed.replace('- Thanh điệu:', '').trim();
        continue;
      }

      if (trimmed.startsWith('- Văn hóa:')) {
        inVocabulary = false;
        line.culture = trimmed.replace('- Văn hóa:', '').trim();
        continue;
      }

      if (inVocabulary && row.match(/^\s+-\s+/)) {
        const parsed = parseVocabulary(row);
        if (parsed) {
          line.vocabulary.push(parsed);
        }
      }
    }

    lines.push(line);
    index = cursor - 1;
  }

  return lines.sort((left, right) => left.id - right.id);
}

function extractAnalysis(markdown: string): string | undefined {
  const match = markdown.match(
    /##\s+Ph\u00e2n t\u00edch \u00fd ngh\u0129a[\s\S]*?\n([\s\S]+?)(?:\n---\s*\n|$)/,
  );
  return match ? match[1].trim() : undefined;
}

export function parseSongMarkdown(
  markdown: string,
  fileNameWithoutExtension: string,
): Song {
  return {
    id: fileNameWithoutExtension,
    title: extractTitle(markdown, fileNameWithoutExtension),
    vietnameseTitle: extractVietnameseTitle(markdown),
    youtubeUrl: extractYoutubeUrl(markdown),
    lines: parseLineBlocks(markdown),
    analysis: extractAnalysis(markdown),
  };
}
