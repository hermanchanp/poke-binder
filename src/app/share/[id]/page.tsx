import { prisma } from "@/lib/prisma";
import SharedBinderView from "./SharedBinderView";
import { notFound } from "next/navigation";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const binder = await prisma.binder.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, image: true },
      },
      cards: true,
    },
  });

  if (!binder) {
    return notFound();
  }

  return <SharedBinderView binder={binder} />;
}
