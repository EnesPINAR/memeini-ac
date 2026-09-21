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
import { LiquidGlassView } from './LiquidGlassView';
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
        <LiquidGlassView
          borderRadius={32}
          intensity={85}
          style={styles.sheetContainer}
        >
          {/* iOS Grabber */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Modal Header Bar */}
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
            {/* Liquid Grouped Section */}
            <View style={styles.groupedSection}>
              <View style={styles.inputRow}>
                <Text style={styles.fieldLabel}>Başlık</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Meme başlığı girin"
                  placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
            </View>

            <Text style={styles.helperText}>
              Eklediğiniz meme ilgili etiketlerle anında arama sonuçlarında gösterilecektir.
            </Text>
          </ScrollView>
        </LiquidGlassView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 8,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
    color: '#0284C7',
    fontWeight: '500',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0284C7',
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  groupedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
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
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginLeft: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    paddingHorizontal: 16,
    paddingTop: 12,
    lineHeight: 18,
  },
});
