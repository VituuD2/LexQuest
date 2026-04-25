import { requireAdminUser } from "@/lib/server/auth";
import { LevelCreatorApp } from "@/components/LevelCreatorApp";

export const metadata = {
  title: "LexQuest Studio",
  description: "Criador de fases do LexQuest com blocos, JSON e revisao por IA."
};

export default async function CreatorPage() {
  const currentUser = await requireAdminUser();

  return <LevelCreatorApp currentUser={currentUser} />;
}
