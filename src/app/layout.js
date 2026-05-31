import "./globals.css";
import { ConfigProvider } from "antd";
import arEG from "antd/locale/ar_EG";

export const metadata = {
  title: "إدارة القاعات",
  description: "نظام إدارة قاعات الأفراح",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: "'Noto Kufi Arabic', sans-serif",
          background: "#f5f5f5",
        }}
      >
        <ConfigProvider
          locale={arEG}
          direction="rtl"
          theme={{
            token: {
              fontFamily: "'Noto Kufi Arabic', sans-serif",
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
