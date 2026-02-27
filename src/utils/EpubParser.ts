import RNFS from 'react-native-fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { Book, Chapter } from '../types';

export class EpubParser {
  private static parser = new DOMParser();

  static async parse(filePath: string, outputDir?: string): Promise<Book> {
    try {
      console.log('Starting EPUB parse for:', filePath);
      
      // Ensure output directory exists if provided
      if (outputDir) {
        await RNFS.mkdir(outputDir);
      }
      
      // 1. Read the file as base64
      const fileContent = await RNFS.readFile(filePath, 'base64');
      
      // 2. Load into JSZip
      const zip = await JSZip.loadAsync(fileContent, { base64: true });
      
      // 3. Find container.xml to locate the OPF file
      const containerXml = await zip.file('META-INF/container.xml')?.async('text');
      if (!containerXml) throw new Error('Invalid EPUB: META-INF/container.xml not found');
      
      const containerDoc = this.parser.parseFromString(containerXml, 'text/xml');
      const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
      if (!rootfile) throw new Error('Invalid EPUB: rootfile not found in container.xml');
      
      const opfPath = rootfile.getAttribute('full-path');
      if (!opfPath) throw new Error('Invalid EPUB: full-path attribute missing in rootfile');
      
      console.log('OPF Path:', opfPath);
      
      // 4. Read OPF file
      const opfContent = await zip.file(opfPath)?.async('text');
      if (!opfContent) throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
      
      const opfDoc = this.parser.parseFromString(opfContent, 'text/xml');
      
      // 5. Extract Metadata
      const metadata = this.extractMetadata(opfDoc, zip, opfPath);
      
      // 6. Extract Manifest (files) and Spine (reading order)
      const manifest = this.extractManifest(opfDoc);
      const spine = this.extractSpine(opfDoc);
      
      // 7. Construct Content
      const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));
      const chapters: Chapter[] = [];
      let fullContent = ''; // Keep for backward compatibility if needed, or set to empty
      
      for (let i = 0; i < spine.length; i++) {
        const itemId = spine[i];
        const item = manifest[itemId];
        if (item) {
          // item.href is relative to OPF file
          const itemPath = opfDir ? `${opfDir}/${item.href}` : item.href;
          
          const file = zip.file(itemPath);
          if (file) {
            let content = await file.async('text');
            
            // Resolve relative paths for images
            const htmlDir = itemPath.substring(0, itemPath.lastIndexOf('/'));
            content = await this.processContentImages(content, zip, htmlDir, outputDir);
            
            // Extract title from HTML content if possible (simple regex for <title> or <h1>)
            let title = `Chapter ${i + 1}`;
            const titleMatch = content.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i) || content.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
                title = titleMatch[1].replace(/<[^>]+>/g, '').trim(); // Remove tags
            }

            let chapterPath = '';
            
            if (outputDir) {
                // Save chapter to file
                const chapterFileName = `chapter_${itemId}.html`;
                const chapterFilePath = `${outputDir}/${chapterFileName}`;
                await RNFS.writeFile(chapterFilePath, content, 'utf8');
                chapterPath = `file://${chapterFilePath}`;
            }

            chapters.push({
                id: itemId,
                title: title,
                content: outputDir ? '' : content, // Only keep content in memory if not saving to disk
                path: chapterPath
            });

            // For backward compatibility, we might want to keep fullContent populated
            // But to save memory, we should probably stop doing this for large books.
            // Let's keep it for now but maybe limit it?
            // Actually, if we use chapters, we don't need fullContent.
            // fullContent += `<div id="${itemId}" class="chapter">${content}</div>`;
          } else {
            console.warn(`Spine item file not found: ${itemPath}`);
          }
        }
      }
      
      // Resolve Cover Image
      let coverUrl = '';
      if (metadata.coverId && manifest[metadata.coverId]) {
          const coverHref = manifest[metadata.coverId].href;
          const coverPath = opfDir ? `${opfDir}/${coverHref}` : coverHref;
          const coverFile = zip.file(coverPath);
          if (coverFile) {
              const base64 = await coverFile.async('base64');
              const mimeType = this.getMimeType(coverPath);
              coverUrl = `data:${mimeType};base64,${base64}`;
          }
      }

      return {
        id: metadata.identifier || Date.now().toString(),
        title: metadata.title || 'Untitled',
        author: metadata.creator || 'Unknown Author',
        coverUrl: coverUrl,
        description: metadata.description || '',
        content: '', // Empty content to save memory
        chapters: chapters,
      };
      
    } catch (error) {
      console.error('EPUB Parsing Error:', error);
      throw error;
    }
  }

  private static extractMetadata(doc: Document, zip: JSZip, opfPath: string): any {
    const metadata: any = {};
    const metadataNode = doc.getElementsByTagName('metadata')[0] || doc.getElementsByTagName('opf:metadata')[0];
    
    if (metadataNode) {
      const titleNode = metadataNode.getElementsByTagName('dc:title')[0];
      if (titleNode) metadata.title = titleNode.textContent;
      
      const creatorNode = metadataNode.getElementsByTagName('dc:creator')[0];
      if (creatorNode) metadata.creator = creatorNode.textContent;
      
      const descNode = metadataNode.getElementsByTagName('dc:description')[0];
      if (descNode) metadata.description = descNode.textContent;
      
      const identifierNode = metadataNode.getElementsByTagName('dc:identifier')[0];
      if (identifierNode) metadata.identifier = identifierNode.textContent;

      // Cover image logic
      // 1. Check for meta name="cover" content="item-id"
      const metaNodes = metadataNode.getElementsByTagName('meta');
      for (let i = 0; i < metaNodes.length; i++) {
        const meta = metaNodes[i];
        if (meta.getAttribute('name') === 'cover') {
            const coverId = meta.getAttribute('content');
            if (coverId) {
                metadata.coverId = coverId; 
            }
        }
      }
    }
    return metadata;
  }

  private static extractManifest(doc: Document): Record<string, { href: string, type: string }> {
    const manifest: Record<string, { href: string, type: string }> = {};
    const manifestNode = doc.getElementsByTagName('manifest')[0] || doc.getElementsByTagName('opf:manifest')[0];
    
    if (manifestNode) {
      const items = manifestNode.getElementsByTagName('item');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        const mediaType = item.getAttribute('media-type');
        
        if (id && href) {
          manifest[id] = { href, type: mediaType || '' };
        }
      }
    }
    return manifest;
  }

  private static extractSpine(doc: Document): string[] {
    const spine: string[] = [];
    const spineNode = doc.getElementsByTagName('spine')[0] || doc.getElementsByTagName('opf:spine')[0];
    
    if (spineNode) {
      const itemrefs = spineNode.getElementsByTagName('itemref');
      for (let i = 0; i < itemrefs.length; i++) {
        const itemref = itemrefs[i];
        const idref = itemref.getAttribute('idref');
        if (idref) {
          spine.push(idref);
        }
      }
    }
    return spine;
  }

  private static async processContentImages(html: string, zip: JSZip, htmlDir: string, outputDir?: string): Promise<string> {
    // Simple regex to match src attributes
    const imgRegex = /src=["']([^"']+)["']/g;
    let match;
    const replacements: { start: number, end: number, newSrc: string }[] = [];

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src.startsWith('http') || src.startsWith('data:')) continue;

      // Resolve path: htmlDir + src
      const absolutePath = this.resolvePath(htmlDir, src);
      
      const file = zip.file(absolutePath);
      if (file) {
        try {
          let newSrc = '';
          
          if (outputDir) {
            // Extract to file system
            const fileName = absolutePath.replace(/\//g, '_'); // Flatten path
            const destPath = `${outputDir}/${fileName}`;
            
            // Check if file already exists to avoid re-writing
            const exists = await RNFS.exists(destPath);
            if (!exists) {
               const base64 = await file.async('base64');
               await RNFS.writeFile(destPath, base64, 'base64');
            }
            
            newSrc = `file://${destPath}`;
          } else {
            // Fallback to base64 embedding
            const base64 = await file.async('base64');
            const mimeType = this.getMimeType(absolutePath);
            newSrc = `data:${mimeType};base64,${base64}`;
          }
          
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            newSrc: `src="${newSrc}"`
          });
        } catch (e) {
            console.warn('Failed to load image:', absolutePath, e);
        }
      }
    }

    // Apply replacements in reverse
    for (let i = replacements.length - 1; i >= 0; i--) {
        const { start, end, newSrc } = replacements[i];
        html = html.substring(0, start) + newSrc + html.substring(end);
    }
    
    return html;
  }

  private static resolvePath(base: string, relative: string): string {
    const stack = base.split('/');
    const parts = relative.split('/');
    
    if (base === '') stack.pop();

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  }

  private static getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      default: return 'application/octet-stream';
    }
  }
}
