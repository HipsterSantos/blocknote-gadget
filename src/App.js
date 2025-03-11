import React, { useEffect } from "react";
import { BlockNoteView, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { GadgetApi } from "./gadgetApi";

export default function App() {
  const editor = useCreateBlockNote({
    initialContent: [{ type: "paragraph", content: "Type '/' to start" }],
  });

  let api; // Store api instance outside useEffect to avoid re-creation
  useEffect(() => {
    api = new GadgetApi(editor);
    window.parent.postMessage({ type: "GADGET_READY" }, "*");
    return () => api.destroy();
  }, [editor]);

  return (
    <div style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
      <BlockNoteView editor={editor} slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={(query) => api.getSlashMenuItems(query)}
        />
      </BlockNoteView>
    </div>
  );
}