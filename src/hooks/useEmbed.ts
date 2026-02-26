import { useEffect, useState } from 'react';

export const useEmbed = (url: string) => {
    const [embedHtml, setEmbedHtml] = useState<string | null>(null);
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

                if (cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am')) {
                    setPlatform('instagram');
                    try {
                        const response = await fetch(`https://api.instagram.com/oembed/?url=${cleanUrl}&omitscript=true`);
                        if (response.ok) {
                            const data = await response.json();
                            setEmbedHtml(data.html);
                            setThumbnail(data.thumbnail_url);
                        } else {
                            // Fallback for Instagram if oEmbed fails (common due to auth requirements)
                            setEmbedHtml(`<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote>`);
                        }
                    } catch (e) {
                        setEmbedHtml(`<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote>`);
                    }
                } else if (cleanUrl.includes('tiktok.com')) {
                    setPlatform('tiktok');
                    try {
                        const response = await fetch(`https://www.tiktok.com/oembed?url=${cleanUrl}`);
                        if (response.ok) {
                            const data = await response.json();
                            setEmbedHtml(data.html);
                            setThumbnail(data.thumbnail_url);
                        } else {
                            // Fallback for TikTok
                            const videoId = cleanUrl.split('/video/')[1] || cleanUrl.split('/').pop();
                            setEmbedHtml(`<blockquote class="tiktok-embed" cite="${cleanUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;" > <section> </section> </blockquote>`);
                        }
                    } catch (e) {
                        const videoId = cleanUrl.split('/video/')[1] || cleanUrl.split('/').pop();
                        setEmbedHtml(`<blockquote class="tiktok-embed" cite="${cleanUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;" > <section> </section> </blockquote>`);
                    }
                } else {
                    setPlatform('unknown');
                    setError('Unsupported platform');
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

    return { embedHtml, platform, thumbnail, isLoading, error };
};
