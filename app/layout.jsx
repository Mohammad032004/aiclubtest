import "./globals.css";
import Providers from "./providers.jsx";

export const metadata = {
  title: "AI Club Recruitment Platform",
  description: "Admin-controlled recruitment testing platform for the AI Club.",
};

export const viewport = {
  themeColor: "#0B1120",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
