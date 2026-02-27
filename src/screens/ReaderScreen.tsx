import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  StatusBar, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Image, 
  Alert,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList, Book, Chapter } from '../types';
import { MOCK_BOOKS } from '../data/mockBooks';
import { generateImageFromText } from '../services/ImageGenerationService';
import { EpubParser } from '../utils/EpubParser';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const BOOKS_STORAGE_KEY = '@my_books';
const { width, height } = Dimensions.get('window');

export default function ReaderScreen() {
  const route = useRoute<ReaderScreenRouteProp>();
  const navigation = useNavigation();
  const { bookId, book: paramBook } = route.params;
  
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [chapterContent, setChapterContent] = useState<string>('');

  // Default font size 20
  const [fontSize, setFontSize] = useState(20);
  const webviewRef = useRef<WebView>(null);
  const lastScrollYRef = useRef(0);
  const [selectedText, setSelectedText] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  
  // TOC
  const [isTOCVisible, setIsTOCVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;

  useEffect(() => {
    const loadContent = async () => {
      setIsLoadingContent(true);
      // Prefer paramBook as it contains the latest metadata from storage
      let initialBook = paramBook || MOCK_BOOKS.find(b => b.id === bookId);
      
      if (initialBook) {
        // Initialize state from book
        if (initialBook.lastChapterIndex !== undefined) {
            setCurrentChapterIndex(initialBook.lastChapterIndex);
        }
        if (initialBook.lastScrollY) {
            lastScrollYRef.current = initialBook.lastScrollY;
        }

        // If book has chapters, use them. If not, try to parse or fallback.
        if (initialBook.chapters && initialBook.chapters.length > 0) {
             setCurrentBook(initialBook);
             await loadChapter(initialBook, initialBook.lastChapterIndex || 0);
        } else if (initialBook.localPath && initialBook.type === 'epub') {
             // Re-parse or first parse for EPUB to get chapters
             try {
                 const assetsDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_assets`;
                 const chaptersDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_chapters`;
                 // We need to parse to get chapters structure
                 const parsed = await EpubParser.parse(initialBook.localPath, chaptersDir);
                 
                 // Merge new parsed data
                 const updatedBook = {
                     ...initialBook,
                     chapters: parsed.chapters,
                     content: '' // Clear legacy content to save memory
                 };
                 setCurrentBook(updatedBook);
                 await loadChapter(updatedBook, updatedBook.lastChapterIndex || 0);
                 
                 // Save this structure update
                 updateBookInStorage(updatedBook);
             } catch (e) {
                 console.error('Failed to parse EPUB chapters', e);
                 // Fallback to legacy content loading
                 loadLegacyContent(initialBook);
             }
        } else {
             // TXT or other files
             loadLegacyContent(initialBook);
        }
      }
      setIsLoadingContent(false);
    };
    loadContent();
  }, [bookId, paramBook]);

  const loadLegacyContent = async (book: Book) => {
      if ((!book.content || book.content.trim() === '') && book.localPath) {
         try {
             let content = '';
             if (book.type === 'txt') {
                 const fileContent = await RNFS.readFile(book.localPath, 'utf8');
                 content = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body { font-size: 18px; line-height: 1.6; padding: 20px; font-family: system-ui; }
                        pre { white-space: pre-wrap; font-family: inherit; }
                      </style>
                    </head>
                    <body><pre>${fileContent}</pre></body></html>
                  `;
             } else {
                 content = `<html><body><h1>${book.title}</h1><p>Preview not available.</p></body></html>`;
             }
             const updated = { ...book, content };
             setCurrentBook(updated);
             setChapterContent(content);
         } catch (e) {
             console.error('Legacy load error', e);
         }
      } else {
          setCurrentBook(book);
          setChapterContent(book.content);
      }
  };

  const loadChapter = async (book: Book, index: number) => {
      if (!book.chapters || !book.chapters[index]) return;
      
      try {
          const chapter = book.chapters[index];
          let content = '';
          
          if (chapter.path.startsWith('file://')) {
              const path = chapter.path.replace('file://', '');
              content = await RNFS.readFile(path, 'utf8');
          } else {
              content = chapter.content;
          }
          
          setChapterContent(content);
          // Reset scroll when changing chapters unless it's the initial load
          // But for initial load, we might want to restore scroll. 
          // Current logic: only restore if index matches initial index.
          // Simpler: Just scroll to top on chapter change, handle restore separately.
      } catch (e) {
          console.error('Failed to load chapter', e);
          Alert.alert('Error', 'Failed to load chapter content.');
      }
  };

  const changeChapter = async (newIndex: number) => {
      if (!currentBook || !currentBook.chapters) return;
      if (newIndex < 0 || newIndex >= currentBook.chapters.length) return;
      
      setIsLoadingContent(true);
      setCurrentChapterIndex(newIndex);
      lastScrollYRef.current = 0; // Reset scroll for new chapter
      await loadChapter(currentBook, newIndex);
      setIsLoadingContent(false);
  };

  const updateBookInStorage = async (updatedBook: Book) => {
      try {
        const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
        let books: Book[] = storedBooks ? JSON.parse(storedBooks) : [];
        const index = books.findIndex(b => b.id === updatedBook.id);
        
        // Prepare book for storage (don't store content)
        const bookToSave = { ...updatedBook, content: '' };
        // We do save chapters metadata (paths), but not their content if it's large.
        // Our parser logic puts content in files, so chapters array is safe to save.
        
        if (index !== -1) {
            books[index] = bookToSave;
        } else {
            books.push(bookToSave);
        }
        await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
      } catch (e) {
          console.error('Failed to update book storage', e);
      }
  };

  const saveProgress = async () => {
    if (currentBook) {
        const updatedBook = {
            ...currentBook,
            lastChapterIndex: currentChapterIndex,
            lastScrollY: lastScrollYRef.current
        };
        // Update local state
        setCurrentBook(updatedBook);
        // Save to storage
        await updateBookInStorage(updatedBook);
        console.log(`Saved progress: Chapter ${currentChapterIndex}, Scroll ${lastScrollYRef.current}`);
    }
  };

  // Save progress on unmount or chapter change
  useEffect(() => {
      return () => { saveProgress(); };
  }, [currentChapterIndex, bookId]); // Also save when chapter changes

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 40));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'selection') {
        const text = data.content;
        if (text && text.trim().length > 0) {
          setSelectedText(text.trim());
          setIsMenuVisible(true);
        } else {
          setIsMenuVisible(false);
          setSelectedText('');
        }
      } else if (data.type === 'scroll') {
        lastScrollYRef.current = data.scrollY;
      }
    } catch (e) {}
  };

  const handleGenerateImage = async () => {
    if (!selectedText) return;
    
    setIsMenuVisible(false);
    setIsGenerating(true);
    setIsImageModalVisible(true);
    
    try {
      // Append style prompt if available
      let prompt = selectedText;
      if (currentBook?.stylePrompt) {
          prompt = `${currentBook.stylePrompt}\n\n${selectedText}`;
          console.log('Using style prompt:', currentBook.stylePrompt);
      }
      
      const url = await generateImageFromText(prompt);
      setGeneratedImageUrl(url);
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('生成失败', error.message || '请检查网络或 API Key 配置');
      setIsImageModalVisible(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTOC = () => {
      if (isTOCVisible) {
          Animated.timing(slideAnim, {
              toValue: -width * 0.8,
              duration: 300,
              useNativeDriver: true
          }).start(() => setIsTOCVisible(false));
      } else {
          setIsTOCVisible(true);
          Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
          }).start();
      }
  };

  const renderTOCItem = ({ item, index }: { item: Chapter, index: number }) => (
      <TouchableOpacity 
        style={[
            styles.tocItem, 
            currentChapterIndex === index && styles.tocItemActive
        ]}
        onPress={() => {
            toggleTOC();
            changeChapter(index);
        }}
      >
          <Text style={[
              styles.tocText,
              currentChapterIndex === index && styles.tocTextActive
          ]} numberOfLines={1}>
              {item.title}
          </Text>
      </TouchableOpacity>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: currentBook?.title || '阅读',
      headerLeft: () => (
          <TouchableOpacity onPress={toggleTOC} style={{ marginLeft: 10, padding: 5 }}>
              <Text style={{ fontSize: 24 }}>≡</Text>
          </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={decreaseFontSize} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={increaseFontSize} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentBook, isTOCVisible]);

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        document.body.style.fontSize = '${fontSize}px';
        true;
      `);
    }
  }, [fontSize]);

  // Inject JS to listen for selection and scroll
  const injectedJS = `
    let lastKnownScrollPosition = 0;
    let ticking = false;
    window.addEventListener('scroll', function(e) {
      lastKnownScrollPosition = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'scroll',
            scrollY: lastKnownScrollPosition
          }));
          ticking = false;
        });
        ticking = true;
      }
    });

    document.addEventListener('selectionchange', function() {
      // Debounce the message
      if (window.selectionTimeout) clearTimeout(window.selectionTimeout);
      window.selectionTimeout = setTimeout(function() {
        var selection = window.getSelection().toString();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'selection',
          content: selection
        }));
      }, 500);
    });
    
    // Disable default context menu
    document.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    true;
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        body {
          font-size: ${fontSize}px;
          line-height: 1.6;
          padding: 20px;
          padding-bottom: 100px;
          color: #333;
          font-family: -apple-system, system-ui, sans-serif;
          background-color: #fff;
          max-width: 100vw;
          overflow-x: hidden;
          word-wrap: break-word;
        }
        img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
        pre { white-space: pre-wrap; font-family: inherit; }
      </style>
    </head>
    <body>
      ${chapterContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.scrollTo(0, ${lastScrollYRef.current || 0});
          }, 100);
        };
      </script>
    </body>
    </html>
  `;

  if (isLoadingContent) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Chapter Content */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        source={{ html: htmlContent, baseUrl: '' }}
        style={styles.webview}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJS}
        onMessage={handleWebViewMessage}
      />

      {/* Chapter Navigation Buttons (Overlay) */}
      {currentBook?.chapters && currentBook.chapters.length > 0 && (
          <View style={styles.chapterNavContainer}>
              <TouchableOpacity 
                style={[styles.navBtn, currentChapterIndex === 0 && styles.navBtnDisabled]} 
                onPress={() => changeChapter(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
              >
                  <Text style={styles.navBtnText}>{'< 上一章'}</Text>
              </TouchableOpacity>
              
              <Text style={styles.chapterInfo}>
                  {currentChapterIndex + 1} / {currentBook.chapters.length}
              </Text>
              
              <TouchableOpacity 
                style={[styles.navBtn, currentChapterIndex === currentBook.chapters.length - 1 && styles.navBtnDisabled]} 
                onPress={() => changeChapter(currentChapterIndex + 1)}
                disabled={currentChapterIndex === currentBook.chapters.length - 1}
              >
                  <Text style={styles.navBtnText}>{'下一章 >'}</Text>
              </TouchableOpacity>
          </View>
      )}

      {/* TOC Sidebar */}
      {isTOCVisible && (
        <View style={styles.tocOverlay}>
            <TouchableWithoutFeedback onPress={toggleTOC}>
                <View style={styles.tocBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.tocDrawer, { transform: [{ translateX: slideAnim }] }]}>
                <Text style={styles.tocHeader}>目录</Text>
                <FlatList
                    data={currentBook?.chapters || []}
                    renderItem={renderTOCItem}
                    keyExtractor={(item, index) => item.id + index}
                    contentContainerStyle={styles.tocList}
                />
            </Animated.View>
        </View>
      )}

      {/* Selection Menu - Only Generate Image */}
      {isMenuVisible && selectedText.length > 0 && (
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle} numberOfLines={1}>Selected: {selectedText}</Text>
          <View style={styles.menuButtons}>
            <TouchableOpacity style={[styles.menuBtn, styles.menuBtnPrimary]} onPress={handleGenerateImage}>
              <Text style={styles.menuBtnTextPrimary}>生成图画</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Generation Result Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsImageModalVisible(false)}>
            <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>生成结果</Text>
                    <TouchableOpacity onPress={() => setIsImageModalVisible(false)}>
                        <Text style={styles.closeBtn}>关闭</Text>
                    </TouchableOpacity>
                    </View>
                    
                    <View style={styles.imageContainer}>
                    {isGenerating ? (
                        <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>正在根据文字生成画面...</Text>
                        <Text style={styles.loadingSubText}>
                            {currentBook?.stylePrompt ? `Style: ${currentBook.stylePrompt}\n` : ''}
                            "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
                        </Text>
                        </View>
                    ) : generatedImageUrl ? (
                        <Image 
                        source={{ uri: generatedImageUrl }} 
                        style={styles.generatedImage} 
                        resizeMode="contain"
                        />
                    ) : (
                        <Text>生成失败</Text>
                    )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fontBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 80, // Moved up to avoid chapter nav
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  menuTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  menuButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  menuBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnPrimary: {
    backgroundColor: '#007AFF',
  },
  menuBtnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    fontSize: 16,
    color: '#007AFF',
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  loadingState: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Chapter Navigation
  chapterNavContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
      backgroundColor: '#fff',
  },
  navBtn: {
      padding: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
  },
  navBtnDisabled: {
      opacity: 0.5,
  },
  navBtnText: {
      color: '#333',
      fontWeight: '600',
  },
  chapterInfo: {
      fontSize: 14,
      color: '#666',
  },
  // TOC Styles
  tocOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      flexDirection: 'row',
  },
  tocBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tocDrawer: {
      width: '80%',
      backgroundColor: '#fff',
      paddingTop: 50, // For status bar
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 10,
  },
  tocHeader: {
      fontSize: 22,
      fontWeight: 'bold',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  tocList: {
      paddingBottom: 20,
  },
  tocItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f5f5f5',
  },
  tocItemActive: {
      backgroundColor: '#e6f2ff',
  },
  tocText: {
      fontSize: 16,
      color: '#333',
  },
  tocTextActive: {
      color: '#007AFF',
      fontWeight: '600',
  },
});
