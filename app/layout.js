import localFont from "next/font/local";
import "./globals.css";
import { GlobalProvider } from "./lib/GlobalContext";
import { AuthProvider } from "./Context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "M5C Logs",
  description: "M5C Logistics Software",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <GlobalProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
