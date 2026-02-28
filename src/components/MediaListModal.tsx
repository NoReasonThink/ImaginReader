import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Alert, 
  Platform, 
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { MediaHistoryService, MediaItem } from '../services/MediaHistoryService';
import { useTheme, useLanguage } from '../contexts';

interface MediaListModalProps {
  visible: boolean;
  onClose: () => void;
}

const MediaListItem = ({ 
  item, 
  theme, 
  t,
  onPlay, 
  onView, 
  onSave, 
  onShare, 
  onDelete 
}: { 
  item: MediaItem, 
  theme: any, 
  t: (key: any) => string,
  onPlay: (item: MediaItem) => void,
  onView: (item: MediaItem) => void,
  onSave: (item: MediaItem) => void,
  onShare: (item: MediaItem) => void,
  onDelete: (id: string) => void
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <View style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.itemHeader}>
                <Text style={[styles.itemType, { color: theme.colors.primary }]}>
                    {item.type === 'video' ? '🎬 Video' : '🖼️ Image'}
                </Text>
                <Text style={[styles.itemDate, { color: theme.colors.textSecondary }]}>
                    {new Date(item.timestamp).toLocaleString()}
                </Text>
            </View>
            
            <View style={styles.promptContainer}>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
                    <Text style={[styles.itemPrompt, { color: theme.colors.text }]} numberOfLines={isExpanded ? undefined : 1}>
                        {item.prompt}
                    </Text>
                    <Text style={[styles.expandBtn, { color: theme.colors.primary }]}>
                        {isExpanded ? t('collapse') : t('expand')}
                    </Text>
                </TouchableOpacity>
            </View>
    
            {item.status === 'pending' ? (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={{ marginLeft: 8, color: theme.colors.textSecondary }}>{t('generating')}</Text>
                </View>
            ) : item.status === 'failed' ? (
                <Text style={{ color: theme.colors.error, marginVertical: 10 }}>{t('generationFailed')}</Text>
            ) : (
                <TouchableOpacity 
                    style={styles.mediaPreview}
                    onPress={() => {
                        if (item.type === 'video') onPlay(item);
                        // else view image logic if needed
                    }}
                >
                    {item.type === 'image' ? (
                        <Image source={{ uri: item.url }} style={styles.thumbnail} resizeMode="cover" />
                    ) : (
                        <View style={styles.thumbnailPlaceholder}>
                            <Text style={{ fontSize: 30 }}>▶️</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
    
            <View style={styles.actionButtons}>
                {item.status === 'completed' && (
                    <>
                        {item.type === 'video' ? (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onPlay(item)}>
                                <Text style={{ color: theme.colors.primary }}>{t('play')}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onView(item)}>
                                <Text style={{ color: theme.colors.primary }}>{t('view')}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(item)}>
                            <Text style={{ color: theme.colors.success }}>{t('save')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(item)}>
                            <Text style={{ color: theme.colors.primary }}>{t('share')}</Text>
                        </TouchableOpacity>
                    </>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.id)}>
                    <Text style={{ color: theme.colors.error }}>{t('delete') || 'Delete'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export const MediaListModal: React.FC<MediaListModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  const loadHistory = async () => {
    const items = await MediaHistoryService.getHistory();
    setMediaItems(items);
  };

  useEffect(() => {
    if (visible) {
      loadHistory();
      const interval = setInterval(async () => {
        const items = await MediaHistoryService.getHistory();
        setMediaItems(items);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const handleShare = async (item: MediaItem) => {
    if (!item.url) return;
    try {
        const ext = item.type === 'video' ? 'mp4' : 'png';
        const timestamp = new Date().getTime();
        const destPath = `${RNFS.CachesDirectoryPath}/share_${timestamp}.${ext}`;
        
        const options = {
            fromUrl: item.url,
            toFile: destPath
        };

        const result = await RNFS.downloadFile(options).promise;

        if (result.statusCode === 200) {
             await Share.open({
                url: `file://${destPath}`,
                type: item.type === 'video' ? 'video/mp4' : 'image/png',
                title: t('share'),
                message: item.prompt,
                failOnCancel: false,
            });
        } else {
             Alert.alert(t('error'), 'Failed to download file for sharing');
        }
    } catch (error: any) {
      console.log('Share error:', error);
      if (error.message !== 'User did not share') {
          Alert.alert(t('error'), error.message);
      }
    }
  };

  const handleSave = async (item: MediaItem) => {
    if (!item.url) return;
    try {
        if (Platform.OS === 'android' && Platform.Version < 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(t('error'), 'Permission denied');
                return;
            }
        }

        const ext = item.type === 'video' ? 'mp4' : 'png';
        const timestamp = new Date().getTime();
        const destPath = `${RNFS.PicturesDirectoryPath}/Imagin_${timestamp}.${ext}`;
        
        const options = {
            fromUrl: item.url,
            toFile: destPath
        };

        const result = await RNFS.downloadFile(options).promise;

        if (result.statusCode === 200) {
            Alert.alert(t('save'), `${t('success')} \n${destPath}`);
        } else {
            Alert.alert(t('error'), t('error'));
        }
    } catch (error: any) {
        Alert.alert(t('error'), error.message);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      t('delete') || 'Delete',
      t('deleteConfirm') || 'Are you sure?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm') || 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await MediaHistoryService.removeItem(id);
            loadHistory();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
            <Text style={[styles.title, { color: theme.colors.headerText }]}>{t('generatedMedia')}</Text>
            <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeBtn, { color: theme.colors.headerText }]}>{t('close')}</Text>
            </TouchableOpacity>
        </View>

        <FlatList
            data={mediaItems}
            renderItem={({ item }) => (
                <MediaListItem 
                    item={item} 
                    theme={theme}
                    t={t}
                    onPlay={setSelectedVideo}
                    onView={() => {}} 
                    onSave={handleSave}
                    onShare={handleShare}
                    onDelete={handleDelete}
                />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 50, color: theme.colors.textSecondary }}>
                    {t('emptyMedia')}
                </Text>
            }
        />

        {/* Video Player Modal */}
        <Modal 
            visible={!!selectedVideo} 
            transparent={true} 
            onRequestClose={() => setSelectedVideo(null)}
            supportedOrientations={['portrait', 'landscape']}
        >
            <View style={styles.videoModalOverlay}>
                <View style={styles.videoContainer}>
                    <TouchableOpacity 
                        style={styles.closeVideoBtn} 
                        onPress={() => setSelectedVideo(null)}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕ {t('close')}</Text>
                    </TouchableOpacity>
                    {selectedVideo && selectedVideo.url && (
                        <WebView
                            source={{ html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                    <style>
                                        body { margin: 0; padding: 0; background: black; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                        video { width: 100%; height: auto; max-height: 100vh; }
                                    </style>
                                </head>
                                <body>
                                    <video controls autoplay playsinline>
                                        <source src="${selectedVideo.url}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>
                                </body>
                                </html>
                            ` }}
                            style={{ flex: 1, backgroundColor: 'black' }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            originWhitelist={['*']}
                        />
                    )}
                </View>
            </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemType: {
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 12,
  },
  promptContainer: {
      marginBottom: 12,
  },
  itemPrompt: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  expandBtn: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '600',
  },
  statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
  },
  mediaPreview: {
      height: 150,
      width: '100%',
      backgroundColor: '#eee',
      borderRadius: 8,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
  thumbnail: {
      width: '100%',
      height: '100%',
  },
  thumbnailPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
  },
  actionButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
  },
  actionBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
  },
  videoModalOverlay: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
  },
  videoContainer: {
      width: '100%',
      height: '80%', // Not full screen to allow closing easily
  },
  closeVideoBtn: {
      padding: 20,
      alignItems: 'flex-end',
  },
});
