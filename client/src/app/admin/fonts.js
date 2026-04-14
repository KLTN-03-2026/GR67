import { Fraunces, Source_Sans_3 } from "next/font/google";

export const adminSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  variable: "--font-admin-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const adminDisplay = Fraunces({
  subsets: ["latin", "vietnamese"],
  variable: "--font-admin-display",
  display: "swap",
  weight: ["600", "700"],
});
