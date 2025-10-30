'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { type EditorState, type SerializedEditorState } from 'lexical';

import HtmlGeneratorPlugin from '@/components/editor/plugins/html-generated-plugin';
import { TooltipProvider } from '@/components/ui/tooltip';
import { editorConfig } from '@/lib/lexical';
import { cn } from '@/lib/utils';
import { Plugins } from './plugins';

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  onHtmlGenerated
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onHtmlGenerated?: (html: string) => void;
}) {
  return (
    <div className={cn('bg-background overflow-hidden rounded-lg border')}>
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState ? { editorState: JSON.stringify(editorSerializedState) } : {})
        }}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState);
              onSerializedChange?.(editorState.toJSON());
            }}
          />
          {!!onHtmlGenerated && <HtmlGeneratorPlugin onHtmlGenerated={onHtmlGenerated} />}
        </TooltipProvider>
      </LexicalComposer>
    </div>
  );
}
