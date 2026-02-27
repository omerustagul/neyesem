import { useEffect, useState } from 'react';

export const useEmbed = (url: string) => {
    const [embedHtml, setEmbedHtml] = useState<string | null>(null);
    const [nativeVideoUrl, setNativeVideoUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'unknown'>('unknown');
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;

        const fetchEmbed = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Sanitize URL
                const cleanUrl = url.split('?')[0].replace(/\/$/, '');
                const isIG = cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am');
                const isTT = cleanUrl.includes('tiktok.com');

                if (isIG) setPlatform('instagram');
                else if (isTT) setPlatform('tiktok');
                else {
                    setPlatform('unknown');
                    setError('Unsupported platform');
                    setIsLoading(false);
                    return;
                }

                // Attempt Native MP4 Extraction via Cobalt API (https://github.com/imputnet/cobalt)
                let nativeUrlFound = false;
                const COBALT_API = process.env.EXPO_PUBLIC_COBALT_API_URL || 'https://api.cobalt.tools/';

                try {
                    const cobaltRes = await fetch(COBALT_API, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: cleanUrl })
                    });

                    if (cobaltRes.ok) {
                        const cobaltData = await cobaltRes.json();
                        if (cobaltData.status === 'redirect' || cobaltData.status === 'tunnel') {
                            setNativeVideoUrl(cobaltData.url);
                            nativeUrlFound = true;
                        } else if (cobaltData.status === 'picker' && cobaltData.picker?.length > 0) {
                            // If it's a carousel/slideshow, pick the first video or photo
                            setNativeVideoUrl(cobaltData.picker[0].url);
                            if (cobaltData.picker[0].thumb) setThumbnail(cobaltData.picker[0].thumb);
                            nativeUrlFound = true;
                        }
                    }
                } catch (e) {
                    console.warn('Cobalt API failed, falling back to iframe/oembed', e);
                }

                if (!nativeUrlFound) {
                    // Fallback to iframes if API fails (e.g., due to rate limits or auth)
                    if (isIG) {
                        setEmbedHtml(`<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote>`);
                    } else if (isTT) {
                        const videoId = cleanUrl.split('/video/')[1] || cleanUrl.split('/').pop();
                        setEmbedHtml(`<blockquote class="tiktok-embed" cite="${cleanUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;" > <section> </section> </blockquote>`);
                    }
                }
            } catch (err) {
                console.error('Embed fetch error:', err);
                setError('Failed to fetch embed content');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmbed();
    }, [url]);

    return { embedHtml, nativeVideoUrl, platform, thumbnail, isLoading, error };
};
