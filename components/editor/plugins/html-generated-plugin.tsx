'use client';
import { $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

export default function HtmlGeneratorPlugin({
  onHtmlGenerated
}: {
  onHtmlGenerated: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          editorState.read(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            onHtmlGenerated(htmlString);
          });
        }
      }
    );

    return () => {
      unregisterListener();
    };
  }, [editor, onHtmlGenerated]);

  return null;
}
