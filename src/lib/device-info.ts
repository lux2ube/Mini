
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
        const response = await fetch(`http://ip-api.com/json/?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`);
        if (!response.ok) {
            throw new Error(`Failed to fetch IP info: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status === 'fail') {
            throw new Error(`IP-API error: ${data.message}`);
        }
        return {
            ip: data.query,
            country: data.countryCode,
            region: data.regionName,
            city: data.city,
        };
    } catch (error) {
        console.warn("Could not fetch geo data from ip-api.com:", error);
        return { ip: 'unknown' };
    }
}


export async function getClientSessionInfo(): Promise<{ deviceInfo: DeviceInfo, geoInfo: GeoInfo }> {
    const deviceInfo = getDeviceInfo();
    const geoInfo = await getGeoInfo();
    return { deviceInfo, geoInfo };
}
