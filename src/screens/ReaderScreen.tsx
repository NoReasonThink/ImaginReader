import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Animated,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList, Book, Chapter } from '../types';
import { MOCK_BOOKS } from '../data/mockBooks';
import { generateImageFromText } from '../services/ImageGenerationService';
import { EpubParser } from '../utils/EpubParser';
import { useTheme, useLanguage } from '../contexts';
import { ThemeType } from '../themes';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const BOOKS_STORAGE_KEY = '@my_books';
const { width, height } = Dimensions.get('window');

export default function ReaderScreen() {
  const route = useRoute<ReaderScreenRouteProp>();
  const navigation = useNavigation();
  const { bookId, book: paramBook } = route.params;
  const { theme, setTheme, themeType } = useTheme();
  const { t } = useLanguage();
  
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

  // Settings Modal
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

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
      } catch (e) {
          console.error('Failed to load chapter', e);
          Alert.alert(t('error'), t('loading'));
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
        
        const bookToSave = { ...updatedBook, content: '' };
        
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
        setCurrentBook(updatedBook);
        await updateBookInStorage(updatedBook);
    }
  };

  useEffect(() => {
      return () => { saveProgress(); };
  }, [currentChapterIndex, bookId]);

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
      let prompt = selectedText;
      if (currentBook?.stylePrompt) {
          prompt = `${currentBook.stylePrompt}\n\n${selectedText}`;
      }
      
      const url = await generateImageFromText(prompt);
      setGeneratedImageUrl(url);
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert(t('generationFailed'), error.message || t('error'));
      setIsImageModalVisible(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedImageUrl) return;

    try {
        if (Platform.OS === 'android' && Platform.Version < 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: t('save'),
                    message: "App needs permission to save image",
                    buttonNeutral: t('cancel'),
                    buttonNegative: t('cancel'),
                    buttonPositive: t('confirm')
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(t('error'), "Permission denied");
                return;
            }
        }

        const timestamp = new Date().getTime();
        const destPath = `${RNFS.PicturesDirectoryPath}/ImaginReader_${timestamp}.png`;
        
        const options = {
            fromUrl: generatedImageUrl,
            toFile: destPath
        };

        const result = await RNFS.downloadFile(options).promise;

        if (result.statusCode === 200) {
            Alert.alert(t('save'), `Saved to:\n${destPath}`);
        } else {
            Alert.alert(t('error'), "Failed to save image");
        }
    } catch (error: any) {
        console.error(error);
        Alert.alert(t('error'), error.message);
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
            { borderBottomColor: theme.colors.border },
            currentChapterIndex === index && { backgroundColor: theme.colors.tocActiveBackground }
        ]}
        onPress={() => {
            toggleTOC();
            changeChapter(index);
        }}
      >
          <Text style={[
              styles.tocText,
              { color: theme.colors.tocText },
              currentChapterIndex === index && { color: theme.colors.tocActiveText }
          ]} numberOfLines={1}>
              {item.title}
          </Text>
      </TouchableOpacity>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: currentBook?.title || t('reader'),
      headerLeft: () => (
          <TouchableOpacity onPress={toggleTOC} style={{ marginLeft: 10, padding: 5 }}>
              <Text style={{ fontSize: 24, color: theme.colors.headerText }}>≡</Text>
          </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.fontBtn}>
            <Text style={{ fontSize: 20, color: theme.colors.primary }}>Aa</Text>
          </TouchableOpacity>
        </View>
      ),
      headerStyle: { backgroundColor: theme.colors.headerBackground },
      headerTintColor: theme.colors.headerText,
    });
  }, [navigation, currentBook, isTOCVisible, theme]);

  // Inject JS to listen for selection and scroll
  const injectedJS = useMemo(() => `
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
  `, []);

  const htmlContent = useMemo(() => `
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
          color: ${theme.colors.readerText};
          font-family: ${theme.typography.fontFamily};
          background-color: ${theme.colors.readerBackground};
          max-width: 100vw;
          overflow-x: hidden;
          word-wrap: break-word;
        }
        img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
        pre { white-space: pre-wrap; font-family: inherit; }
        ::selection { background: ${theme.colors.readerHighlight}; }
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
  `, [chapterContent, fontSize, theme]);

  const handleWebViewLoad = useCallback(() => {
    // Restore scroll position after content load
    if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
            window.scrollTo(0, ${lastScrollYRef.current || 0});
            true;
        `);
    }
  }, []);

  if (isLoadingContent) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.textSecondary }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.readerBackground }]}>
      <StatusBar barStyle={themeType === 'dark' ? "light-content" : "dark-content"} backgroundColor={theme.colors.headerBackground} />
      
      {/* Chapter Content */}
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        source={{ html: htmlContent, baseUrl: '' }}
        style={[styles.webview, { backgroundColor: theme.colors.readerBackground }]}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJS}
        onMessage={handleWebViewMessage}
        onLoadEnd={handleWebViewLoad}
      />

      {/* Chapter Navigation Buttons (Overlay) */}
      {currentBook?.chapters && currentBook.chapters.length > 0 && (
          <View style={[styles.chapterNavContainer, { backgroundColor: theme.colors.readerBackground, borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.navBtn, { backgroundColor: theme.colors.buttonSecondaryBackground }, currentChapterIndex === 0 && styles.navBtnDisabled]} 
                onPress={() => changeChapter(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
              >
                  <Text style={[styles.navBtnText, { color: theme.colors.buttonSecondaryText }]}>{`< ${t('previousChapter')}`}</Text>
              </TouchableOpacity>
              
              <Text style={[styles.chapterInfo, { color: theme.colors.textSecondary }]}>
                  {currentChapterIndex + 1} / {currentBook.chapters.length}
              </Text>
              
              <TouchableOpacity 
                style={[styles.navBtn, { backgroundColor: theme.colors.buttonSecondaryBackground }, currentChapterIndex === currentBook.chapters.length - 1 && styles.navBtnDisabled]} 
                onPress={() => changeChapter(currentChapterIndex + 1)}
                disabled={currentChapterIndex === currentBook.chapters.length - 1}
              >
                  <Text style={[styles.navBtnText, { color: theme.colors.buttonSecondaryText }]}>{`${t('nextChapter')} >`}</Text>
              </TouchableOpacity>
          </View>
      )}

      {/* TOC Sidebar */}
      {isTOCVisible && (
        <View style={styles.tocOverlay}>
            <TouchableWithoutFeedback onPress={toggleTOC}>
                <View style={styles.tocBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.tocDrawer, { 
                transform: [{ translateX: slideAnim }],
                backgroundColor: theme.colors.tocBackground
            }]}>
                <Text style={[styles.tocHeader, { 
                    color: theme.colors.tocText, 
                    borderBottomColor: theme.colors.border 
                }]}>{t('toc')}</Text>
                <FlatList
                    data={currentBook?.chapters || []}
                    renderItem={renderTOCItem}
                    keyExtractor={(item, index) => item.id + index}
                    contentContainerStyle={styles.tocList}
                />
            </Animated.View>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSettingsVisible(false)}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                    <View style={[styles.settingsModal, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.settingRow}>
                            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('fontSize')}</Text>
                            <View style={styles.settingControls}>
                                <TouchableOpacity onPress={decreaseFontSize} style={[styles.settingBtn, { backgroundColor: theme.colors.buttonSecondaryBackground }]}>
                                    <Text style={{ color: theme.colors.buttonSecondaryText }}>A-</Text>
                                </TouchableOpacity>
                                <Text style={[styles.settingValue, { color: theme.colors.text }]}>{fontSize}</Text>
                                <TouchableOpacity onPress={increaseFontSize} style={[styles.settingBtn, { backgroundColor: theme.colors.buttonSecondaryBackground }]}>
                                    <Text style={{ color: theme.colors.buttonSecondaryText }}>A+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('theme')}</Text>
                            <View style={styles.themeOptions}>
                                {(['light', 'dark', 'sepia'] as ThemeType[]).map((tType) => (
                                    <TouchableOpacity 
                                        key={tType}
                                        style={[
                                            styles.themeOption, 
                                            { backgroundColor: tType === 'light' ? '#fff' : tType === 'dark' ? '#333' : '#F4ECD8' },
                                            themeType === tType && { borderWidth: 2, borderColor: theme.colors.primary }
                                        ]}
                                        onPress={() => setTheme(tType)}
                                    >
                                        <Text style={{ 
                                            color: tType === 'light' ? '#000' : tType === 'dark' ? '#fff' : '#5B4636',
                                            fontSize: 12 
                                        }}>
                                            {t(tType)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Selection Menu */}
      {isMenuVisible && selectedText.length > 0 && (
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.menuTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>Selected: {selectedText}</Text>
          <View style={styles.menuButtons}>
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: theme.colors.primary }]} onPress={handleGenerateImage}>
              <Text style={{ color: theme.colors.buttonPrimaryText, fontWeight: '600' }}>{t('generateImage')}</Text>
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
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => setIsImageModalVisible(false)}>
                        <Text style={[styles.closeBtn, { color: theme.colors.primary }]}>{t('close')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('generationResult')}</Text>
                    {generatedImageUrl ? (
                        <TouchableOpacity onPress={handleSaveImage}>
                            <Text style={[styles.saveBtn, { color: theme.colors.success }]}>{t('save')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{width: 40}} /> 
                    )}
                    </View>
                    
                    <View style={[styles.imageContainer, { backgroundColor: theme.colors.background }]}>
                    {isGenerating ? (
                        <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('generating')}</Text>
                        <Text style={[styles.loadingSubText, { color: theme.colors.textSecondary }]}>
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
                        <Text style={{ color: theme.colors.error }}>{t('generationFailed')}</Text>
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
    marginRight: 10,
  },
  fontBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    fontSize: 16,
    padding: 4,
  },
  saveBtn: {
    fontSize: 16,
    padding: 4,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
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
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  chapterNavContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
  },
  navBtn: {
      padding: 10,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
  },
  navBtnDisabled: {
      opacity: 0.5,
  },
  navBtnText: {
      fontWeight: '600',
  },
  chapterInfo: {
      fontSize: 14,
  },
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
      paddingTop: 50,
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
  },
  tocList: {
      paddingBottom: 20,
  },
  tocItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
  },
  tocText: {
      fontSize: 16,
  },
  settingsModal: {
      width: '100%',
      borderRadius: 16,
      padding: 20,
  },
  settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  settingLabel: {
      fontSize: 16,
      fontWeight: '600',
  },
  settingControls: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  settingBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
  },
  settingValue: {
      fontSize: 18,
      minWidth: 30,
      textAlign: 'center',
  },
  themeOptions: {
      flexDirection: 'row',
  },
  themeOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
});
