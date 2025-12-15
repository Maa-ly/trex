import { MediaType } from '@/config/constants';
import { PrivacySettings } from '@/types';

export interface DetectedMedia {
  title: string;
  type: MediaType;
  url: string;
  progress?: number;
}

export function detectMediaFromURL(url: string, privacySettings: PrivacySettings): DetectedMedia | null {
  const hostname = new URL(url).hostname.toLowerCase();
  
  // Netflix
  if (hostname.includes('netflix.com')) {
    if (!privacySettings.trackShows && !privacySettings.trackMovies) return null;
    const title = extractNetflixTitle();
    return {
      title: title || 'Unknown',
      type: privacySettings.trackMovies ? MediaType.Movie : MediaType.Show,
      url,
    };
  }
  
  // YouTube
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    if (!privacySettings.trackShows && !privacySettings.trackAnime) return null;
    const title = extractYouTubeTitle();
    return {
      title: title || 'Unknown',
      type: MediaType.Show,
      url,
    };
  }
  
  // Crunchyroll
  if (hostname.includes('crunchyroll.com')) {
    if (!privacySettings.trackAnime) return null;
    const title = extractCrunchyrollTitle();
    return {
      title: title || 'Unknown',
      type: MediaType.Anime,
      url,
    };
  }
  
  // Amazon Prime Video
  if (hostname.includes('primevideo.com')) {
    if (!privacySettings.trackShows && !privacySettings.trackMovies) return null;
    const title = extractPrimeVideoTitle();
    return {
      title: title || 'Unknown',
      type: privacySettings.trackMovies ? MediaType.Movie : MediaType.Show,
      url,
    };
  }
  
  // Kindle/Books
  if (hostname.includes('amazon.com') && url.includes('kindle')) {
    if (!privacySettings.trackBooks) return null;
    const title = extractKindleTitle();
    return {
      title: title || 'Unknown',
      type: MediaType.Book,
      url,
    };
  }
  
  // Manga sites
  if (hostname.includes('mangadex.org') || hostname.includes('mangakakalot.com')) {
    if (!privacySettings.trackManga) return null;
    const title = extractMangaTitle();
    return {
      title: title || 'Unknown',
      type: MediaType.Manga,
      url,
    };
  }
  
  return null;
}

function extractNetflixTitle(): string | null {
  try {
    const titleElement = document.querySelector('h1[data-uia="video-title"]');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function extractYouTubeTitle(): string | null {
  try {
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function extractCrunchyrollTitle(): string | null {
  try {
    const titleElement = document.querySelector('h1[class*="title"]');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function extractPrimeVideoTitle(): string | null {
  try {
    const titleElement = document.querySelector('h1[data-automation-id="title"]');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function extractKindleTitle(): string | null {
  try {
    const titleElement = document.querySelector('#productTitle, h1.a-size-large');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

function extractMangaTitle(): string | null {
  try {
    const titleElement = document.querySelector('h1, .manga-title, .title');
    return titleElement?.textContent?.trim() || null;
  } catch {
    return null;
  }
}

export function generateMediaId(title: string, type: MediaType): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${sanitized}-${type}`;
}

