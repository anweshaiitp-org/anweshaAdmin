'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { 
  FiBold, 
  FiItalic, 
  FiList, 
  FiMessageSquare, 
  FiMinus 
} from 'react-icons/fi';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDarkMode: boolean;
}

const MenuBar = ({ editor, isDarkMode }: { editor: any; isDarkMode: boolean }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-2 rounded transition-colors flex items-center justify-center font-bold text-sm min-w-[32px] ${
      isActive
        ? isDarkMode
          ? 'bg-blue-600 text-white'
          : 'bg-[#DBEAFE] text-[#2563EB]'
        : isDarkMode
        ? 'text-gray-400 hover:bg-gray-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div
      className={`flex flex-wrap gap-2 p-2 border-b ${
        isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-[#EFF6FF] bg-gray-50'
      } rounded-t-xl`}
    >
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        H3
      </button>

      <div className={`w-px h-6 my-auto ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold"
      >
        <FiBold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic"
      >
        <FiItalic size={16} />
      </button>

      <div className={`w-px h-6 my-auto ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

      {/* Lists & Blocks */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <FiList size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Ordered List"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        <FiMessageSquare size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnClass(false)}
        title="Divider Line"
      >
        <FiMinus size={16} />
      </button>
    </div>
  );
};

export default function TiptapEditor({ content, onChange, isDarkMode }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown, // This magical extension automatically parses pasted markdown!
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // prose classes style the H1, blockquotes, and lists properly
        class: `prose max-w-none p-4 min-h-[150px] outline-none ${
          isDarkMode 
            ? 'prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white' 
            : 'prose-p:text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900'
        }`,
      },
    },
  });

  return (
    <div
      className={`border-2 rounded-xl overflow-hidden transition-colors ${
        isDarkMode
          ? 'border-gray-700 bg-gray-800 focus-within:border-blue-500'
          : 'border-[#EFF6FF] bg-white focus-within:border-[#2563EB]'
      }`}
    >
      <MenuBar editor={editor} isDarkMode={isDarkMode} />
      <div className="max-h-[400px] overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}