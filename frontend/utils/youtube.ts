const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function getYouTubeId(input: string): string | null {
    // cho phép truyền thẳng id
    if (ID_RE.test(input)) return input;

    try {
        const url = new URL(input);

        // youtu.be/<id>
        if (url.hostname.includes('youtu.be')) {
            const id = url.pathname.split('/')[1];
            return ID_RE.test(id) ? id : null;
        }

        // /watch?v=<id>
        const v = url.searchParams.get('v');
        if (v && ID_RE.test(v)) return v;

        // /embed/<id> hoặc /shorts/<id>
        const parts = url.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        return ID_RE.test(last) ? last : null;
    } catch {
        return null;
    }
}

export function toYouTubeEmbedUrl(input: string): string | null {
    const id = getYouTubeId(input);
    return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function isYouTubeUrl(input: string): boolean {
    try {
        const { hostname } = new URL(input);
        return hostname.includes('youtube.com') || hostname.includes('youtu.be');
    } catch {
        return false;
    }
}
