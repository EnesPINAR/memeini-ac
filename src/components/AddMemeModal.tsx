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
      Alert.alert('Eksik Bilgi', 'Lütfen meme için bir başlık girin.');
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
      uploaderNickname: nickname.trim() || 'anonim_meme_lord',
      rating: 5,
      ratingCount: 1,
      description: 'Kullanıcı tarafından yeni eklendi.',
    };

    onAddMeme(newMeme);
    setTitle('');
    setImageUrl('');
    setTags('');
    setNickname('');
    onClose();
    Alert.alert('Harika!', 'Memeniz başarıyla eklendi ve etiketleriyle yayına alındı!');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sen Meme Ekle 🚀</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Meme Başlığı *</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Pazartesi sabahı toplantısı"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Görsel URL (veya boş bırakın)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://... (Örnek görsel atanır)"
              placeholderTextColor="#888"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Etiketler (Boşluk veya virgülle ayırın)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: #pazartesi #ofis #kahve"
              placeholderTextColor="#888"
              value={tags}
              onChangeText={setTags}
            />

            <Text style={styles.label}>Kullanıcı Adın</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: meme_ustasi"
              placeholderTextColor="#888"
              value={nickname}
              onChangeText={setNickname}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Ionicons name="cloud-upload-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Yayımla</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderColor: '#000000',
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
