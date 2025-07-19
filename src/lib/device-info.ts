
"use client";

import type { DeviceInfo } from "@/types";

function detectBrowser(ua: string): string {
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("SamsungBrowser")) return "Samsung Browser";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    if (ua.includes("Trident")) return "Internet Explorer";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    return "Unknown";
}

function detectOS(ua: string): string {
    if (/android/i.test(ua)) return "Android";
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "iOS";
    if (/Win/i.test(ua)) return "Windows";
    if (/Mac/i.test(ua)) return "MacOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

export function getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
        return {
            device: 'Unknown',
            os: 'Unknown',
            browser: 'Unknown',
        }
    }

    const userAgent = navigator.userAgent;

    return {
        device: /mobile/i.test(userAgent) ? 'Mobile' : 'Desktop',
        os: detectOS(userAgent),
        browser: detectBrowser(userAgent),
    };
}
