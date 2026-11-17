<template>
  <main class="app-shell" dir="rtl">
    <section class="notes-panel">
      <header class="hero">
        <p class="eyebrow">simple-notes-app</p>
        <h1>تطبيق ملاحظات بسيط</h1>
        <p class="subtitle">أضف ملاحظاتك وعدلها أو احذفها من صفحة عربية واحدة.</p>
      </header>

      <section class="form-card">
        <h2>{{ isEditing ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة' }}</h2>

        <form class="note-form" @submit.prevent="submitNote">
          <label class="field">
            <span>العنوان</span>
            <input
              v-model="form.title"
              type="text"
              maxlength="150"
              placeholder="اكتب عنوان الملاحظة"
            />
          </label>

          <label class="field">
            <span>المحتوى</span>
            <textarea
              v-model="form.content"
              rows="5"
              placeholder="اكتب التفاصيل هنا"
            />
          </label>

          <p v-if="validationMessage" class="message error">{{ validationMessage }}</p>
          <p v-else-if="errorMessage" class="message error">{{ errorMessage }}</p>

          <div class="actions">
            <button class="primary-btn" type="submit" :disabled="isSubmitDisabled">
              {{ isSubmitting ? 'جارٍ الحفظ...' : isEditing ? 'حفظ التعديل' : 'إضافة' }}
            </button>
            <button
              v-if="isEditing"
              class="secondary-btn"
              type="button"
              @click="resetForm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </section>

      <section class="list-card">
        <div class="list-head">
          <h2>قائمة الملاحظات</h2>
          <button class="ghost-btn" type="button" @click="loadNotes" :disabled="isLoading">
            {{ isLoading ? 'جارٍ التحديث...' : 'تحديث' }}
          </button>
        </div>

        <p v-if="isLoading" class="message">جارٍ تحميل الملاحظات...</p>
        <p v-else-if="notes.length === 0" class="message empty">لا توجد ملاحظات حاليًا.</p>

        <ul v-else class="notes-list">
          <li v-for="note in notes" :key="note.id" class="note-item">
            <div class="note-copy">
              <div class="note-top">
                <h3>{{ note.title }}</h3>
                <time>{{ formatDate(note.created_at) }}</time>
              </div>
              <p>{{ note.content || 'لا يوجد محتوى لهذه الملاحظة.' }}</p>
            </div>

            <div class="item-actions">
              <button class="secondary-btn" type="button" @click="startEdit(note)">
                تعديل
              </button>
              <button class="danger-btn" type="button" @click="removeNote(note.id)">
                حذف
              </button>
            </div>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import type { Note } from './services/notesApi';
import { isValidNoteTitle } from './utils/pipeline';
import { computed, onMounted, reactive, ref } from 'vue';
import { createNote, deleteNote, getNotes, updateNote } from './services/notesApi';

const notes = ref<Note[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const editingId = ref<number | null>(null);
const hasTriedSubmit = ref(false);

const form = reactive({
  title: '',
  content: '',
});

const isEditing = computed(() => editingId.value !== null);
const validationMessage = computed(() => {
  if (!hasTriedSubmit.value || isValidNoteTitle(form.title)) {
    return '';
  }

  return 'العنوان مطلوب.';
});
const isSubmitDisabled = computed(() => isSubmitting.value || !isValidNoteTitle(form.title));

const loadNotes = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    notes.value = await getNotes();
  } catch (error) {
    errorMessage.value =
      (isAxiosError<{ message: string }>(error) ? error.response?.data?.message : undefined) || 'تعذر تحميل الملاحظات. حاول مرة أخرى.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  form.title = '';
  form.content = '';
  editingId.value = null;
  errorMessage.value = '';
  hasTriedSubmit.value = false;
};

const submitNote = async () => {
  hasTriedSubmit.value = true;

  if (!isValidNoteTitle(form.title)) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
  };

  try {
    if (editingId.value !== null) {
      const updatedNote = await updateNote(editingId.value, payload);
      notes.value = notes.value.map((note) => (note.id === updatedNote.id ? updatedNote : note));
    } else {
      const newNote = await createNote(payload);
      notes.value = [newNote, ...notes.value];
    }

    resetForm();
  } catch (error) {
    errorMessage.value =
      (isAxiosError<{ message: string }>(error) ? error.response?.data?.message : undefined) || 'تعذر حفظ الملاحظة. حاول مرة أخرى.';
  } finally {
    isSubmitting.value = false;
  }
};

const startEdit = (note: Note) => {
  editingId.value = note.id;
  form.title = note.title;
  form.content = note.content || '';
  errorMessage.value = '';
  hasTriedSubmit.value = false;
};

const removeNote = async (id: number) => {
  errorMessage.value = '';

  try {
    await deleteNote(id);
    notes.value = notes.value.filter((note) => note.id !== id);

    if (editingId.value === id) {
      resetForm();
    }
  } catch (error) {
    errorMessage.value =
      (isAxiosError<{ message: string }>(error) ? error.response?.data?.message : undefined) || 'تعذر حذف الملاحظة. حاول مرة أخرى.';
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

onMounted(loadNotes);
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background:
    radial-gradient(circle at top, rgba(233, 196, 106, 0.24), transparent 28%),
    linear-gradient(135deg, #f8f4ea 0%, #f2e8cf 45%, #e9edc9 100%);
  color: #2d1f14;
}

:global(button),
:global(input),
:global(textarea) {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px 16px;
}

.notes-panel {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.hero,
.form-card,
.list-card {
  background: rgba(255, 252, 245, 0.88);
  border: 1px solid rgba(111, 78, 55, 0.14);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 45px rgba(79, 55, 40, 0.12);
  backdrop-filter: blur(6px);
}

.eyebrow {
  margin: 0 0 10px;
  color: #8d5b2d;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero h1,
.form-card h2,
.list-card h2,
.note-top h3 {
  margin: 0;
}

.subtitle {
  margin: 12px 0 0;
  color: #5f4a3b;
  line-height: 1.7;
}

.note-form,
.notes-list {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #d7c5a9;
  border-radius: 14px;
  padding: 12px 14px;
  background: #fffdf8;
  color: #2d1f14;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: 2px solid rgba(141, 91, 45, 0.22);
  border-color: #8d5b2d;
}

.actions,
.item-actions,
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 10px 16px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.primary-btn {
  background: #8d5b2d;
  color: #fff;
}

.secondary-btn,
.ghost-btn {
  background: #efe2cb;
  color: #50361d;
}

.danger-btn {
  background: #c44536;
  color: #fff;
}

.message {
  margin: 0;
  color: #5f4a3b;
}

.message.error {
  color: #b42318;
}

.message.empty {
  padding: 20px 0;
}

.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.note-item {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(141, 91, 45, 0.14);
}

.note-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.note-top time {
  color: #7a6a5e;
  font-size: 0.9rem;
}

.note-copy p {
  margin: 0;
  line-height: 1.8;
  white-space: pre-wrap;
  color: #4a392c;
}

@media (max-width: 640px) {
  .app-shell {
    padding: 20px 12px;
  }

  .hero,
  .form-card,
  .list-card {
    padding: 18px;
    border-radius: 20px;
  }

  .actions,
  .item-actions,
  .list-head,
  .note-top {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
