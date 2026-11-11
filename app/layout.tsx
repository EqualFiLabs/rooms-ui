import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rooms — EqualFi Labs",
  description: "Explore Rooms, a game of equal odds and very different crowds. Interactive concept for EqualFi Labs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
