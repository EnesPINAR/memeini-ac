import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          {/* iOS Grabber */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* iOS Modal Header Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>

            <Text style={styles.navTitle}>Meme Ekle</Text>

            <TouchableOpacity onPress={handleSubmit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.doneText}>Yayımla</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            {/* Grouped Section */}
            <View style={styles.groupedSection}>
              <View style={styles.inputRow}>
                <Text style={styles.fieldLabel}>Başlık</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Meme başlığı girin"
                  placeholderTextColor="#8E8E93"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.separator} />

              <View style={styles.inputRow}>
                <Text style={styles.fieldLabel}>Görsel</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Görsel linki (opsiyonel)"
                  placeholderTextColor="#8E8E93"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.separator} />

              <View style={styles.inputRow}>
                <Text style={styles.fieldLabel}>Etiketler</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="#komik #kod #kedi"
                  placeholderTextColor="#8E8E93"
                  value={tags}
                  onChangeText={setTags}
                />
              </View>

              <View style={styles.separator} />

              <View style={styles.inputRow}>
                <Text style={styles.fieldLabel}>Kullanıcı</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Kullanıcı adınız"
                  placeholderTextColor="#8E8E93"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
            </View>

            <Text style={styles.helperText}>
              Eklediğiniz meme ilgili etiketlerle anında arama sonuçlarında gösterilecektir.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C7C7CC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  groupedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  fieldLabel: {
    width: 85,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 10,
    lineHeight: 18,
  },
});
