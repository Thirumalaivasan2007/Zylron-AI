export async function getDeviceFingerprint() {
    const ua = navigator.userAgent;
    
    // Simple OS detection
    let os = 'Unknown OS';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

    // Simple Browser detection
    let browser = 'Unknown Browser';
    if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
    else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

    // Fingerprint hash
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const language = navigator.language || '';
    const platform = navigator.platform || '';
    const fingerprintRaw = `${ua}|${screenInfo}|${language}|${platform}`;
    
    let hash = 0;
    for (let i = 0; i < fingerprintRaw.length; i++) {
        const char = fingerprintRaw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    const fingerprint = 'zyl_' + Math.abs(hash).toString(16);

    // Fetch IP and Geo-location using a free public IP API
    let ipAddress = '127.0.0.1';
    let city = 'Unknown City';
    let country = 'Unknown Country';

    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            ipAddress = data.ip || '127.0.0.1';
            city = data.city || 'Chennai';
            country = data.country_name || 'India';
        }
    } catch (e) {
        console.warn("Geo lookup failed, using local/mock data:", e.message);
        ipAddress = '103.81.24.18';
        city = 'Chennai';
        country = 'India';
    }

    return {
        fingerprint,
        browser,
        os,
        ipAddress,
        city,
        country
    };
}
