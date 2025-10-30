import { nodes } from '@/components/blocks/editor-00/nodes';
import { $generateHtmlFromNodes } from '@lexical/html';
import { type InitialConfigType } from '@lexical/react/LexicalComposer';
import { createEditor, ParagraphNode, TextNode } from 'lexical';

import { editorTheme } from '@/components/editor/themes/editor-theme';

import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

export const editorConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: editorTheme,
  nodes: [
    HeadingNode,
    ParagraphNode,
    TextNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode
  ],
  onError: (error: Error) => {
    console.error(error);
  }
};

/**
 * Converts Lexical JSON to HTML using Lexical's built-in utilities
 * @param lexicalJson - The Lexical JSON object (serialized editor state)
 * @returns The HTML string
 */
export function lexicalToHtml(lexicalJson: any): string {
  const json = typeof lexicalJson === 'string' ? JSON.parse(lexicalJson) : lexicalJson;

  if (!json || !json.root) {
    return '';
  }

  try {
    // Create an editor using the standard createEditor from lexical
    // This avoids type compatibility issues with the headless editor
    const templateEditor = createEditor({
      namespace: 'EmailTemplate',
      nodes: nodes,
      theme: editorConfig.theme,
      onError: (error) => {
        console.error('Lexical Editor Error:', error);
      }
    });

    // Set the editor state from the provided JSON
    templateEditor.setEditorState(templateEditor.parseEditorState(json));

    // Generate HTML from the editor state
    let html = '';

    // We need to use read() to access the editor state safely
    templateEditor.read(() => {
      html = $generateHtmlFromNodes(templateEditor);
    });

    return html;
  } catch (error) {
    console.error('Error converting Lexical JSON to HTML:', error);
    return '';
  }
}
