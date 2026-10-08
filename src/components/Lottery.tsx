import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { drawDistinct, randomInt } from "@/lib/lottery";
import { cn } from "@/lib/utils";

type Draw = { main: number[]; special?: number };

type Game = {
  name: string;
  mainCount: number;
  hasSpecial: boolean;
  draw: () => Draw;
};

const GAMES: Game[] = [
  {
    name: "Power 6/55",
    mainCount: 6,
    hasSpecial: false,
    draw: () => ({ main: drawDistinct(6, 55) }),
  },
  {
    name: "Mega 6/45",
    mainCount: 6,
    hasSpecial: false,
    draw: () => ({ main: drawDistinct(6, 45) }),
  },
  {
    name: "Lotto 5/35",
    mainCount: 5,
    hasSpecial: true,
    draw: () => ({ main: drawDistinct(5, 35), special: randomInt(12) }),
  },
];

function Ball({
  value,
  index,
  special = false,
}: {
  value?: number;
  index: number;
  special?: boolean;
}) {
  const empty = value === undefined;
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-full text-base font-semibold tabular-nums",
        empty
          ? "border-2 border-dashed border-muted-foreground/40 text-muted-foreground"
          : special
            ? "bg-amber-500 text-black animate-in fade-in zoom-in-50 fill-mode-both"
            : "bg-primary text-primary-foreground animate-in fade-in zoom-in-50 fill-mode-both",
      )}
      style={empty ? undefined : { animationDelay: `${index * 60}ms` }}
    >
      {empty ? "--" : String(value).padStart(2, "0")}
    </span>
  );
}

function GameCard({ game }: { game: Game }) {
  const [draw, setDraw] = useState<Draw | null>(null);
  // Bumped on every draw so balls remount and replay the pop-in animation.
  const [drawKey, setDrawKey] = useState(0);

  function generate() {
    setDraw(game.draw());
    setDrawKey((key) => key + 1);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">{game.name}</CardTitle>
        <Button onClick={generate}>Generate</Button>
      </CardHeader>
      <CardContent>
        <div key={drawKey} className="flex flex-wrap items-end gap-2">
          {Array.from({ length: game.mainCount }, (_, i) => (
            <Ball key={i} index={i} value={draw?.main[i]} />
          ))}
          {game.hasSpecial && (
            <>
              <span className="mx-1 h-11 w-px bg-border" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Special</span>
                <Ball
                  index={game.mainCount}
                  value={draw?.special}
                  special
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Lottery() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-5">
      <h1 className="m-0 text-[34px] font-semibold text-(--text-h)">
        Lottery
      </h1>
      {GAMES.map((game) => (
        <GameCard key={game.name} game={game} />
      ))}
    </main>
  );
}
