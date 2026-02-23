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
                if (url.includes('instagram.com')) {
                    setPlatform('instagram');
                    const response = await fetch(`https://api.instagram.com/oembed/?url=${url}&omitscript=true`);
                    const data = await response.json();
                    setEmbedHtml(data.html);
                    setThumbnail(data.thumbnail_url);
                } else if (url.includes('tiktok.com')) {
                    setPlatform('tiktok');
                    const response = await fetch(`https://www.tiktok.com/oembed?url=${url}`);
                    const data = await response.json();
                    setEmbedHtml(data.html);
                    setThumbnail(data.thumbnail_url);
                } else {
                    setPlatform('unknown');
                    setError('Unsupported platform');
                }
            } catch (err) {
                setError('Failed to fetch embed content');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmbed();
    }, [url]);

    return { embedHtml, platform, thumbnail, isLoading, error };
};
