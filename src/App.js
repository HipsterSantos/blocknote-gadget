import React, { useEffect, useRef } from "react";
import { useCreateBlockNote,SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { GadgetApi } from "./gadgetApi";
import { GadgetProvider, useGadgetState } from "./state";

function Editor() {
  const { state, dispatch } = useGadgetState();
  const editor = useCreateBlockNote({
    initialContent: state.initialContent,
  });
  const apiRef = useRef(null); // Store GadgetApi instance

  useEffect(() => {
    apiRef.current = new GadgetApi(editor, state, dispatch);
    window.parent.postMessage({ type: "GADGET_READY" }, "*");
    return () => apiRef.current.destroy();
  }, [editor, state, dispatch]);

  // Async getItems function
  const getItems = async (query) => {
    return apiRef.current.getSlashMenuItems(query);
  };

  return (
    <div style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
      <BlockNoteView editor={editor} slashMenu={false}>
        <SuggestionMenuController triggerCharacter="/" getItems={getItems} />
      </BlockNoteView>
    </div>
  );
}

export default function App() {
  return (
    <GadgetProvider>
      <Editor />
    </GadgetProvider>
  );
}