import { Fraunces, Outfit } from "next/font/google";
import "./kiosk.css";

const fontDisplay = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-kiosk-display",
});

const fontSans = Outfit({
  subsets: ["latin", "vietnamese"],
  variable: "--font-kiosk-sans",
});

export default function KioskLayout({ children }) {
  return (
    <div
      className={`kiosk-root min-h-[100dvh] ${fontSans.variable} ${fontDisplay.variable} font-[family-name:var(--font-kiosk-sans)] antialiased`}
    >
      {children}
    </div>
  );
}
