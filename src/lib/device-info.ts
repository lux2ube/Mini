
"use client";

import type { DeviceInfo, GeoInfo } from "@/types";

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

function getDeviceInfo(): DeviceInfo {
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

async function getGeoInfo(): Promise<GeoInfo> {
    try {
        const response = await fetch(`https://ipinfo.io/json?token=${process.env.NEXT_PUBLIC_IPINFO_TOKEN}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch IP info: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            ip: data.ip,
            country: data.country,
            region: data.region,
            city: data.city,
        };
    } catch (error) {
        console.warn("Could not fetch geo data from ipinfo.io:", error);
        return { ip: 'unknown' };
    }
}


export async function getClientSessionInfo(): Promise<{ deviceInfo: DeviceInfo, geoInfo: GeoInfo }> {
    const deviceInfo = getDeviceInfo();
    const geoInfo = await getGeoInfo();
    return { deviceInfo, geoInfo };
}
