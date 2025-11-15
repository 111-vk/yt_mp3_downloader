/**
 * Sends SSE formatted error message
 */
function sendSSEError(res, message) {
    res.write(
        `data: ${JSON.stringify({ status: 'error', message })}\n\n`
    );
    return null;
}

/**
 * Validates a YouTube URL and extracts the video ID.
 * Sends SSE errors and returns null on failure.
 */
function validateYouTubeUrl(url, res) {
    // === 1. Basic Checks ===
    if (!url || typeof url !== 'string') {
        return sendSSEError(res, 'Missing or invalid URL');
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl === '') {
        return sendSSEError(res, 'Empty URL - please paste a valid YouTube link');
    }

    // === 2. URL Format Validation ===
    let parsedUrl;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch {
        return sendSSEError(res, 'Invalid URL format - must start with http:// or https://');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return sendSSEError(res, 'Unsupported protocol - only http:// and https:// allowed');
    }

    // === 3. Hostname Validation ===
    const validHosts = [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
        'm.youtube.com',
        'music.youtube.com'
    ];

    if (!validHosts.includes(parsedUrl.hostname)) {
        return sendSSEError(res, 'Not a YouTube URL');
    }

    // === 4. Path & Parameter Validation ===
    const isValidYouTubePath = () => {
        const { hostname, pathname, searchParams } = parsedUrl;

        if (hostname === 'youtu.be') {
            return pathname !== '/' &&
                /^[a-zA-Z0-9_-]{11}$/.test(pathname.slice(1));
        }

        if (pathname === '/watch' && searchParams.has('v')) {
            return /^[a-zA-Z0-9_-]{11}$/.test(searchParams.get('v'));
        }

        if (pathname.startsWith('/embed/')) {
            const id = pathname.split('/embed/')[1]?.split('?')[0];
            return /^[a-zA-Z0-9_-]{11}$/.test(id);
        }

        if (pathname.startsWith('/v/')) {
            const id = pathname.split('/v/')[1]?.split('?')[0];
            return /^[a-zA-Z0-9_-]{11}$/.test(id);
        }

        if (pathname.startsWith('/shorts/')) {
            const id = pathname.split('/shorts/')[1]?.split('?')[0];
            return /^[a-zA-Z0-9_-]{11}$/.test(id);
        }

        if (hostname === 'music.youtube.com' && searchParams.has('v')) {
            return /^[a-zA-Z0-9_-]{11}$/.test(searchParams.get('v'));
        }

        return false;
    };

    if (!isValidYouTubePath()) {
        return sendSSEError(
            res,
            'Invalid YouTube video link (Supported: watch?v=, youtu.be/, /embed/, /shorts/, music.youtube.com?v=)'
        );
    }

    // === 5. Extract Video ID ===
    const extractVideoId = () => {
        const { hostname, pathname, searchParams } = parsedUrl;

        if (hostname === 'youtu.be') return pathname.slice(1).split('?')[0];
        if (searchParams.has('v')) return searchParams.get('v');
        if (pathname.startsWith('/embed/')) return pathname.split('/embed/')[1].split('?')[0];
        if (pathname.startsWith('/v/')) return pathname.split('/v/')[1].split('?')[0];
        if (pathname.startsWith('/shorts/')) return pathname.split('/shorts/')[1].split('?')[0];

        return null;
    };

    const videoId = extractVideoId();

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return sendSSEError(res, 'Could not extract valid 11-character video ID');
    }

    // === 6. Success ===
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return { videoId, normalizedUrl };
}

export { validateYouTubeUrl };
