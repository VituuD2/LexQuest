import { requireAdminUser } from "@/lib/server/auth";
import { LevelCreatorApp } from "@/components/LevelCreatorApp";
import { getGameCatalog } from "@/lib/game-catalog";

export const metadata = {
  title: "LexQuest Studio",
  description: "Studio de jogos do LexQuest com catalogo sincronizado, blocos, JSON e revisao por IA."
};

export default async function CreatorPage() {
  const currentUser = await requireAdminUser();
  const games = getGameCatalog();

  return <LevelCreatorApp currentUser={currentUser} games={games} />;
}
