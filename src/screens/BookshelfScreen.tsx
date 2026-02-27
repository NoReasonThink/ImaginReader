import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Book } from '../types';
import { MOCK_BOOKS } from '../data/mockBooks';
import { EpubParser } from '../utils/EpubParser';
import { SettingsService, ApiConfig } from '../services/SettingsService';
import { useTheme, useLanguage } from '../contexts';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 40) / COLUMN_COUNT; // 40 is total horizontal padding
const BOOKS_STORAGE_KEY = '@my_books';
const BOOKS_DIR = `${RNFS.DocumentDirectoryPath}/books`;

type BookshelfScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bookshelf'>;

export default function BookshelfScreen() {
  const navigation = useNavigation<BookshelfScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Edit Style State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: '',
    modelCode: '',
    apiUrl: '',
    videoApiKey: '',
    videoModelCode: '',
    videoApiUrl: ''
  });

  useFocusEffect(
    useCallback(() => {
      loadBooks();
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const config = await SettingsService.getApiConfig();
    setApiConfig(config);
  };

  const saveSettings = async () => {
    await SettingsService.saveApiConfig(apiConfig);
    setIsSettingsVisible(false);
    Alert.alert(t('save'), t('save') + ' ' + t('confirm'));
  };

  const loadBooks = async () => {
    try {
      const exists = await RNFS.exists(BOOKS_DIR);
      if (!exists) {
        await RNFS.mkdir(BOOKS_DIR);
      }

      const storedBooks = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
      if (storedBooks) {
        const parsedBooks: Book[] = JSON.parse(storedBooks);
        setBooks(parsedBooks);
      } else {
        setBooks(MOCK_BOOKS);
      }
    } catch (e) {
      console.error('Failed to load books', e);
    }
  };

  const saveBooksToStorage = async (newBooks: Book[]) => {
    try {
      const booksToSave = newBooks.map(book => {
        if (book.localPath) {
            return { ...book, content: '' };
        }
        return book;
      });
      await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(booksToSave));
    } catch (e) {
      console.error('Failed to save books', e);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportBook = async () => {
    try {
      const result = await pick({
        type: [types.plainText, types.allFiles], 
        allowMultiSelection: false,
        copyTo: 'cachesDirectory', 
      });
      
      const res = result[0];
      setIsImporting(true); // Start loading indicator

      // Use setTimeout to allow UI to update before heavy processing
      setTimeout(async () => {
        try {
          await processImport(res);
        } catch (err) {
            console.error(err);
            Alert.alert(t('error'), 'Failed to import file: ' + (err as Error).message);
        } finally {
            setIsImporting(false);
        }
      }, 100);

    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled
      } else {
        console.error(err);
        Alert.alert(t('error'), 'Failed to pick file: ' + (err as Error).message);
      }
    }
  };

  const processImport = async (res: any) => {
      console.log('Importing file:', { name: res.name, type: res.type, uri: res.uri, fileCopyUri: res.fileCopyUri });

      const isText = 
        res.type === 'text/plain' || 
        res.name?.toLowerCase().endsWith('.txt') ||
        (res.uri && res.uri.toLowerCase().endsWith('.txt'));

      const isEpub = 
        res.type === 'application/epub+zip' || 
        res.name?.toLowerCase().endsWith('.epub') ||
        (res.uri && res.uri.toLowerCase().endsWith('.epub'));

      let newBook: Book | null = null;
      let tempFilePath = '';

      // Resolve File Path
      if (res.fileCopyUri) {
          tempFilePath = decodeURIComponent(res.fileCopyUri);
      } else {
         try {
            const destPath = `${RNFS.CachesDirectoryPath}/${res.name || 'temp'}`;
            await RNFS.copyFile(res.uri, destPath);
            tempFilePath = destPath;
         } catch (copyErr) {
            console.warn('Manual copy failed', copyErr);
            tempFilePath = res.uri;
         }
      }
      
      if (tempFilePath && tempFilePath.startsWith('file://')) {
         tempFilePath = tempFilePath.substring(7);
      }
      
      if (!tempFilePath) {
        throw new Error('File path is empty');
      }

      // Generate a unique ID and filename
      const bookId = Date.now().toString();
      const ext = isEpub ? 'epub' : (isText ? 'txt' : 'bin');
      const fileName = `${bookId}.${ext}`;
      const permanentPath = `${BOOKS_DIR}/${fileName}`;

      // Copy file to permanent storage
      await RNFS.copyFile(tempFilePath, permanentPath);

      if (isEpub) {
        try {
          console.log('Parsing EPUB from:', permanentPath);
          const assetsDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_assets`;
          const chaptersDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_chapters`;
          
          // Use updated EpubParser that extracts chapters
          const parsedBook = await EpubParser.parse(permanentPath, chaptersDir);
          
          newBook = {
            ...parsedBook,
            id: bookId,
            title: parsedBook.title || res.name?.replace(/\.[^/.]+$/, "") || 'Imported EPUB',
            author: parsedBook.author || 'Unknown Author',
            coverUrl: parsedBook.coverUrl || 'https://via.placeholder.com/150/FF9500/FFFFFF?text=EPUB',
            description: parsedBook.description || `Imported EPUB.`,
            content: '', // Don't store full content string
            localPath: permanentPath,
            type: 'epub'
          };
        } catch (e) {
          console.error('EPUB Parse Error:', e);
          Alert.alert(t('error'), 'Failed to parse EPUB file.');
          return;
        }
      } else if (isText) {
        try {
          console.log('Reading text file from:', permanentPath);
          const fileContent = await RNFS.readFile(permanentPath, 'utf8');
          
          const content = `
            <!DOCTYPE html>
            <html><body><pre>${fileContent}</pre></body></html>
          `;
          
          newBook = {
            id: bookId,
            title: res.name?.replace(/\.[^/.]+$/, "") || 'Imported Book',
            author: 'Local File',
            coverUrl: 'https://via.placeholder.com/150/007AFF/FFFFFF?text=TXT',
            description: `Imported text file.`,
            content: content,
            localPath: permanentPath,
            type: 'txt'
          };
        } catch (readErr) {
          console.error('File read error:', readErr);
          throw new Error('Could not read file content');
        }
      } else {
        // Fallback
        newBook = {
          id: bookId,
          title: res.name || 'Unknown File',
          author: 'Unknown',
          coverUrl: 'https://via.placeholder.com/150/CCCCCC/000000?text=FILE',
          description: 'Unknown file type',
          content: 'Preview not available',
          localPath: permanentPath,
          type: 'other'
        };
      }

      if (newBook) {
        const updatedBooks = [newBook!, ...books];
        setBooks(updatedBooks);
        saveBooksToStorage(updatedBooks);
        Alert.alert(t('save'), `Imported "${newBook!.title}"`);
      }
  };

  const handleDeleteBook = (bookId: string) => {
    Alert.alert(
      t('deleteBook'),
      t('deleteBookConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('confirm'), 
          style: "destructive", 
          onPress: async () => {
            const bookToDelete = books.find(b => b.id === bookId);
            if (bookToDelete && bookToDelete.localPath) {
                try {
                    await RNFS.unlink(bookToDelete.localPath);
                    // Also try to delete assets/chapters dir if they exist
                    const assetsDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_assets`;
                    const chaptersDir = `${RNFS.DocumentDirectoryPath}/books/${bookId}_chapters`;
                    if (await RNFS.exists(assetsDir)) await RNFS.unlink(assetsDir);
                    if (await RNFS.exists(chaptersDir)) await RNFS.unlink(chaptersDir);
                } catch (e) {
                    console.warn('Failed to delete local files', e);
                }
            }
            
            const updatedBooks = books.filter(b => b.id !== bookId);
            setBooks(updatedBooks);
            saveBooksToStorage(updatedBooks);
          } 
        }
      ]
    );
  };

  const openEditModal = (book: Book) => {
      setEditingBook(book);
      setStylePrompt(book.stylePrompt || '');
      setIsEditModalVisible(true);
  };

  const saveBookStyle = () => {
      if (editingBook) {
          const updatedBooks = books.map(b => {
              if (b.id === editingBook.id) {
                  return { ...b, stylePrompt: stylePrompt };
              }
              return b;
          });
          setBooks(updatedBooks);
          saveBooksToStorage(updatedBooks);
          setIsEditModalVisible(false);
          setEditingBook(null);
      }
  };

  const renderBookItem = ({ item }: { item: Book }) => {
    const progress = item.chapters && item.chapters.length > 0
        ? Math.round(((item.lastChapterIndex || 0) + 1) / item.chapters.length * 100)
        : 0;

    return (
    <View style={styles.bookItemContainer}>
        <TouchableOpacity
        style={styles.bookItem}
        onPress={() => navigation.navigate('Reader', { bookId: item.id, book: item })}
        onLongPress={() => handleDeleteBook(item.id)}
        delayLongPress={500}
        >
        <Image
            source={{ uri: item.coverUrl }}
            style={[styles.bookCover, { borderColor: theme.colors.border }]}
            resizeMode="cover"
        />
        <Text style={[styles.bookTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.bookAuthor, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.author}</Text>
        {progress > 0 && (
            <Text style={[styles.bookProgress, { color: theme.colors.primary }]}>{progress}%</Text>
        )}
        </TouchableOpacity>
        
        {/* Edit Button */}
        <TouchableOpacity 
            style={[styles.editBadge, { backgroundColor: theme.colors.surface }]}
            onPress={() => openEditModal(item)}
        >
            <Text style={[styles.editBadgeText, { color: theme.colors.text }]}>✎</Text>
        </TouchableOpacity>
    </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.headerBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>{t('myBooks')}</Text>
        <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.settingsButton}>
                <Text style={[styles.settingsButtonText, { color: theme.colors.primary }]}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImportBook} style={[styles.importButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.importButtonText, { color: theme.colors.buttonPrimaryText }]}>+</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
              backgroundColor: theme.colors.inputBackground, 
              color: theme.colors.inputText,
              borderColor: theme.colors.inputBorder 
          }]}
          placeholder={t('myBooks') + "..."}
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Books Grid */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('emptyBookshelf')}</Text>
            </View>
        }
      />

      {/* Import Loading Overlay */}
      {isImporting && (
          <View style={styles.loadingOverlay}>
              <View style={[styles.loadingBox, { backgroundColor: theme.colors.surface }]}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('loading')}</Text>
              </View>
          </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('settings')}</Text>
            
            {/* Language Switcher */}
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('language')}:</Text>
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                <TouchableOpacity 
                    style={[
                        styles.langBtn, 
                        language === 'zh' && { backgroundColor: theme.colors.primary },
                        language !== 'zh' && { backgroundColor: theme.colors.buttonSecondaryBackground }
                    ]}
                    onPress={() => setLanguage('zh')}
                >
                    <Text style={{ color: language === 'zh' ? '#fff' : theme.colors.text }}>中文</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.langBtn, 
                        language === 'en' && { backgroundColor: theme.colors.primary },
                        language !== 'en' && { backgroundColor: theme.colors.buttonSecondaryBackground }
                    ]}
                    onPress={() => setLanguage('en')}
                >
                    <Text style={{ color: language === 'en' ? '#fff' : theme.colors.text }}>English</Text>
                </TouchableOpacity>
            </View>
       
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('apiKey')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.apiKey}
              onChangeText={(text) => setApiConfig({...apiConfig, apiKey: text})}
              placeholder={t('apiKey') || "Enter API Key"}
              placeholderTextColor={theme.colors.inputPlaceholder}
              secureTextEntry
            />
            
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('model')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.modelCode}
              onChangeText={(text) => setApiConfig({...apiConfig, modelCode: text})}
              placeholder="e.g. wan2.6-t2i"
              placeholderTextColor={theme.colors.inputPlaceholder}
            />
            
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('apiUrl')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.apiUrl}
              onChangeText={(text) => setApiConfig({...apiConfig, apiUrl: text})}
              placeholder={t('apiUrl') || "Enter API URL"}
              placeholderTextColor={theme.colors.inputPlaceholder}
            />



            <Text style={[styles.label, { color: theme.colors.text }]}>{t('videoApiKey')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.videoApiKey}
              onChangeText={(text) => setApiConfig({...apiConfig, videoApiKey: text})}
              placeholder={t('videoApiKeyPlaceholder') || "Same as Image API Key if empty"}
              placeholderTextColor={theme.colors.inputPlaceholder}
              secureTextEntry
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>{t('videoModel')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.videoModelCode}
              onChangeText={(text) => setApiConfig({...apiConfig, videoModelCode: text})}
              placeholder="e.g. wan2.1-t2v-turbo"
              placeholderTextColor={theme.colors.inputPlaceholder}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>{t('videoApiUrl')}:</Text>
            <TextInput
              style={[styles.input, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={apiConfig.videoApiUrl}
              onChangeText={(text) => setApiConfig({...apiConfig, videoApiUrl: text})}
              placeholder={t('videoApiUrl') || "Enter Video API URL"}
              placeholderTextColor={theme.colors.inputPlaceholder}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]} 
                onPress={() => setIsSettingsVisible(false)}
              >
                <Text style={styles.buttonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.success }]} 
                onPress={saveSettings}
              >
                <Text style={styles.buttonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Style Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Style Prompt</Text>
            
            <TextInput
              style={[styles.input, styles.textArea, { 
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.inputText,
                  borderColor: theme.colors.inputBorder
              }]}
              value={stylePrompt}
              onChangeText={setStylePrompt}
              placeholder="e.g. Ink wash painting style..."
              placeholderTextColor={theme.colors.inputPlaceholder}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.success }]} 
                onPress={saveBookStyle}
              >
                <Text style={styles.buttonText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60, // For status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    marginRight: 10,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  importButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 24,
    lineHeight: 26,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bookItemContainer: {
      position: 'relative',
      width: ITEM_WIDTH,
      alignItems: 'center',
  },
  bookItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  bookCover: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.5,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    textAlign: 'center',
  },
  bookProgress: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  editBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
  },
  editBadgeText: {
      fontSize: 14,
      fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
      height: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading Overlay
  loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
  },
  loadingBox: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 5,
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      fontWeight: '600',
  },
  langBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 10,
  }
});
