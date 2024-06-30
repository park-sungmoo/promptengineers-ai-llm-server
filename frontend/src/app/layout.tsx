import "./globals.css";
import 'highlight.js/styles/github-dark-dimmed.min.css';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthProvider from "@/contexts/AuthContext";
import AppProvider from "@/contexts/AppContext";
import ChatProvider from "@/contexts/ChatContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    manifest: "/manifest.json",
    title: "Prompt Engineers Chat",
    description: "Generated by create next app",
};

export const viewport: Viewport = {
    themeColor: "#000",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                />
                <link
                    href="splashscreens/iphone5_splash.png"
                    media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/iphone6_splash.png"
                    media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/iphoneplus_splash.png"
                    media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/iphonex_splash.png"
                    media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/iphonexr_splash.png"
                    media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/iphonexsmax_splash.png"
                    media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/ipad_splash.png"
                    media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/ipadpro1_splash.png"
                    media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/ipadpro3_splash.png"
                    media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
                <link
                    href="splashscreens/ipadpro2_splash.png"
                    media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
                    rel="apple-touch-startup-image"
                />
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <AppProvider>
                        <AuthProvider>
                            <ChatProvider>{children}</ChatProvider>
                        </AuthProvider>
                    </AppProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
