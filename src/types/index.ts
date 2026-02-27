export type RootStackParamList = {
  Bookshelf: undefined;
  Reader: { bookId: string; book?: Book };
};

export interface Chapter {
  id: string;
  title: string;
  content: string;
  path: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  content: string; // Keep for backward compatibility or small files, but prefer chapters for EPUB
  chapters?: Chapter[];
  localPath?: string;
  type?: 'epub' | 'txt' | 'other';
  lastScrollY?: number; // For vertical scroll mode
  lastChapterIndex?: number; // For chapter-based reading
  lastCfi?: string; // For finer progress (optional, but chapter index is a good start)
  lastPageProgress?: number; // 0-1 percentage within chapter
  stylePrompt?: string; // User defined style for image generation
}
