import songBieQuanWoChiKu from "../../songs/别劝我吃苦.md?raw";
import songYuanMeiHao from "../../songs/愿所有美好都会奔向你.md?raw";
import { parseSongMarkdown } from "../lib/parseSongMarkdown";
import type { Song } from "../models/song";

export const songs: Song[] = [
  parseSongMarkdown(songBieQuanWoChiKu, "别劝我吃苦"),
  parseSongMarkdown(songYuanMeiHao, "愿所有美好都会奔向你"),
];
