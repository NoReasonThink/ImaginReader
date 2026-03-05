import RNFS from 'react-native-fs';
import { Chapter } from '../types';

export class TxtParser {
    /**
     * Parse a TXT file into chapters based on regex patterns.
     * Splits content into separate files for better performance in WebView.
     * 
     * @param filePath Local path to the TXT file
     * @param outputDir Directory to save split chapter files
     */
    static async parse(filePath: string, outputDir: string): Promise<{ chapters: Chapter[], title?: string }> {
        try {
            // 1. Read file content
            const content = await RNFS.readFile(filePath, 'utf8');

            // 2. Prepare output directory
            if (!(await RNFS.exists(outputDir))) {
                await RNFS.mkdir(outputDir);
            } else {
                // Clean up existing files
                await RNFS.unlink(outputDir);
                await RNFS.mkdir(outputDir);
            }

            // 3. Regex to match chapter titles
            // Matches: Start of line, optional whitespace, "第", number, "章/节/回/...", optional content, end of line
            // Examples: "第1章", "第一章", "第十章 标题", "第100回"
            const chapterPattern = /(?:^|\n)\s*(第\s*[0-9一二三四五六七八九十百千万]+\s*[章节回卷集部][ \t\f]*.*)(?:\r?\n|$)/g;
            
            const matches = [...content.matchAll(chapterPattern)];
            let chapters: Chapter[] = [];
            let chapterIndex = 0;

            // Helper to write chapter file
            const writeChapter = async (text: string, title: string) => {
                // Wrap content in simple HTML fragment for consistent display in WebView
                // We don't include <html><body> tags here because ReaderScreen wraps it
                // and applies theme/font styles.
                const contentFragment = `
                  <div class="chapter-content">
                    ${(title !== '序章' && !title.startsWith('第')) ? `<h2>${title}</h2>` : ''}
                    <pre>${text}</pre>
                  </div>
                `;
                
                const fileName = `chapter_${chapterIndex}.html`; // Use .html extension
                const chapterPath = `${outputDir}/${fileName}`;
                
                await RNFS.writeFile(chapterPath, contentFragment, 'utf8');
                
                chapters.push({
                    id: `chapter_${chapterIndex}`,
                    title: title.replace(/\s+/g, ' ').trim(),
                    content: '', // Don't keep content in memory
                    path: `file://${chapterPath}`
                });
                chapterIndex++;
            };

            // 4. If no chapters found, split by length or keep as one
            if (matches.length === 0) {
                // If content is too long, split it
                const MAX_LENGTH = 10000; // Split every 10k chars if no chapters found
                if (content.length > MAX_LENGTH) {
                    for (let i = 0; i < content.length; i += MAX_LENGTH) {
                        const chunk = content.substring(i, Math.min(i + MAX_LENGTH, content.length));
                        await writeChapter(chunk, `第 ${chapterIndex + 1} 部分`);
                    }
                } else {
                    await writeChapter(content, '全文');
                }
                return { chapters };
            }

            // 5. Process matched chapters
            
            // Handle Prologue (content before first match)
            if (matches[0].index! > 0) {
                const preContent = content.substring(0, matches[0].index!);
                if (preContent.trim().length > 0) {
                    await writeChapter(preContent, '序章');
                }
            }

            // Handle each chapter
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const title = match[1].trim(); // Group 1 is the title line content
                const start = match.index!;
                const end = (i < matches.length - 1) ? matches[i + 1].index! : content.length;
                
                // Content includes the title line
                const chapterContent = content.substring(start, end);
                
                // Optional: remove the title line from content if we want to render it separately,
                // but usually keeping it is fine as part of the text.
                // For better formatting, we might want to ensure the title is bolded if we rendered raw HTML,
                // but here we are wrapping in <pre>, so let's just keep it as is.
                
                await writeChapter(chapterContent, title);
            }

            return { chapters };

        } catch (error) {
            console.error('TXT Parse Error:', error);
            throw error;
        }
    }
}
