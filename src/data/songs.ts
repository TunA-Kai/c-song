import songBieQuanWoChiKu from "../../songs/别劝我吃苦.md?raw";
import songYuanMeiHao from "../../songs/愿所有美好都会奔向你.md?raw";
import song3 from "../../songs/所有的美好终会属于你.md?raw";
import song4 from "../../songs/背包很小要装满快乐.md?raw";
import songShiMaMaShiNvEr from "../../songs/是妈妈是女儿.md?raw";
import songNiBuBiShiYiDuoHua from "../../songs/你不必是一朵花.md?raw";
import songShengHuoMeiYouShuoMingShu from "../../songs/生活没有说明书.md?raw";
import songRenShengYouDuoShaoJinTianDuoShaoMingTian from "../../songs/人生有多少今天多少明天.md?raw";
import { parseSongMarkdown } from "../lib/parseSongMarkdown";
import type { Song } from "../models/song";

export const songs: Song[] = [
  parseSongMarkdown(songBieQuanWoChiKu, "别劝我吃苦"),
  parseSongMarkdown(songYuanMeiHao, "愿所有美好都会奔向你"),
  parseSongMarkdown(song3, "所有的美好终会属于你"),
  parseSongMarkdown(song4, "背包很小要装满快乐"),
  parseSongMarkdown(songShiMaMaShiNvEr, "是妈妈是女儿"),
  parseSongMarkdown(songNiBuBiShiYiDuoHua, "你不必是一朵花"),
  parseSongMarkdown(songShengHuoMeiYouShuoMingShu, "生活没有说明书"),
  parseSongMarkdown(
    songRenShengYouDuoShaoJinTianDuoShaoMingTian,
    "人生有多少今天多少明天",
  ),
];
