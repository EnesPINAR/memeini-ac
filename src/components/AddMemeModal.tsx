import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { X, UploadCloud } from 'lucide-react-native';
import { CartoonButton, CARTOON_COLORS } from './cartoon/CartoonUI';
import { MemeItem } from '../types/meme';

interface AddMemeModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMeme: (meme: MemeItem) => void;
  defaultTag?: string;
}

export const AddMemeModal: React.FC<AddMemeModalProps> = ({
  visible,
  onClose,
  onAddMeme,
  defaultTag = '',
}) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState(defaultTag ? `#${defaultTag}` : '');
  const [nickname, setNickname] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Eksik Alan', 'Lütfen meme için bir başlık girin.');
      return;
    }

    const cleanTags = tags
      .split(/[\s,]+/)
      .map((t) => t.replace('#', '').trim())
      .filter(Boolean);

    const newMeme: MemeItem = {
      id: Date.now().toString(),
      title: title.trim(),
      imageUrl:
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
      tags: cleanTags.length > 0 ? cleanTags : ['yeni', 'meme'],
      uploaderNickname: nickname.trim() || 'anonim_meme',
      rating: 5,
      ratingCount: 1,
      description: 'Kullanıcı tarafından eklendi.',
    };

    onAddMeme(newMeme);
    setTitle('');
    setImageUrl('');
    setTags('');
    setNickname('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Cartoon Top Handle */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Cartoon Header Bar */}
          <View style={styles.navBar}>
            <Text style={styles.navTitle}>Yeni Meme Ekle 🎨</Text>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#000000" strokeWidth={3} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.fieldLabel}>Meme Başlığı *</Text>
            <View style={styles.inputBoxWrapper}>
              <View style={styles.inputShadow} pointerEvents="none" />
              <View style={styles.inputSurface}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Örn: Pazartesi sabahı ben"
                  placeholderTextColor="#888888"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Görsel URL (Opsiyonel)</Text>
            <View style={styles.inputBoxWrapper}>
              <View style={styles.inputShadow} pointerEvents="none" />
              <View style={styles.inputSurface}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="https://..."
                  placeholderTextColor="#888888"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Etiketler</Text>
            <View style={styles.inputBoxWrapper}>
              <View style={styles.inputShadow} pointerEvents="none" />
              <View style={styles.inputSurface}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="#komik #kod #kedi"
                  placeholderTextColor="#888888"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Kullanıcı Adın</Text>
            <View style={styles.inputBoxWrapper}>
              <View style={styles.inputShadow} pointerEvents="none" />
              <View style={styles.inputSurface}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Örn: meme_lordu"
                  placeholderTextColor="#888888"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
            </View>

            <View style={styles.submitRow}>
              <CartoonButton
                label="Memeyi Yayımla!"
                onPress={handleSubmit}
                bgColor={CARTOON_COLORS.green}
                icon={<UploadCloud size={22} color="#000000" strokeWidth={2.5} />}
                style={{ width: '100%' }}
                borderRadius={20}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 3.5,
    borderColor: '#000000',
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabber: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  navTitle: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARTOON_COLORS.pink,
    borderWidth: 2.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  fieldLabel: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 6,
    marginTop: 10,
  },
  inputBoxWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  inputShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  inputSurface: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  fieldInput: {
    fontFamily: 'Fredoka_600SemiBold',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    paddingVertical: 6,
  },
  submitRow: {
    marginTop: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
});
