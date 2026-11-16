import type { Metadata } from "next";
import Playhouse from "@/components/playhouse/playhouse";

export const metadata: Metadata = {
  title: "Playhouse — Rooms",
  description:
    "Explore a dynamic sample room and inspect the ticket ownership behind its crowd.",
};

export default function PlayhousePage() {
  return <Playhouse />;
}
