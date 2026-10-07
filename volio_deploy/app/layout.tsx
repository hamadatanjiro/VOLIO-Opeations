import "./globals.css";

export const metadata = {
  title: "VOLIO Operations",
  description: "VOLIO operations and finance dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
