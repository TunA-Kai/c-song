import songBieQuanWoChiKu from '../../songs/别劝我吃苦.md?raw';
import songYuanMeiHao from '../../songs/愿所有美好都会奔向你.md?raw';
import song3 from '../../songs/所有的美好终会属于你.md?raw';
import song4 from '../../songs/背包很小要装满快乐.md?raw';
import { parseSongMarkdown } from '../lib/parseSongMarkdown';
import type { Song } from '../models/song';

export const songs: Song[] = [
  parseSongMarkdown(songBieQuanWoChiKu, '别劝我吃苦'),
  parseSongMarkdown(songYuanMeiHao, '愿所有美好都会奔向你'),
  parseSongMarkdown(song3, '所有的美好终会属于你'),
  parseSongMarkdown(song4, '背包很小要装满快乐'),
];
