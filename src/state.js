import React, { createContext, useContext, useReducer } from "react";

const GadgetContext = createContext();

const initialState = {
  serverUrl: "ws://localhost:8080",
  protocol: "ws",
  initialContent: [{ type: "paragraph", content: "Type '/' to start" }],
  slashItems: new Map(), // Map of custom slash menu items
  isConnected: false,
  error: null,
};

function gadgetReducer(state, action) {
  switch (action.type) {
    case "CONFIGURE":
      return {
        ...state,
        serverUrl: action.payload.serverUrl || state.serverUrl,
        protocol: action.payload.protocol || state.protocol,
        initialContent: action.payload.initialContent || state.initialContent,
      };
    case "SET_INITIAL_CONTENT":
      return { ...state, initialContent: action.payload };
    case "REGISTER_SLASH_ITEM":
      const newSlashItems = new Map(state.slashItems);
      newSlashItems.set(action.payload.title, action.payload);
      return { ...state, slashItems: newSlashItems };
    case "SERVER_CONNECTED":
      return { ...state, isConnected: true, error: null };
    case "SERVER_ERROR":
      return { ...state, isConnected: false, error: action.payload };
    default:
      return state;
  }
}

export function GadgetProvider({ children }) {
  const [state, dispatch] = useReducer(gadgetReducer, initialState);
  return <GadgetContext.Provider value={{ state, dispatch }}>{children}</GadgetContext.Provider>;
}

export function useGadgetState() {
  const context = useContext(GadgetContext);
  if (!context) throw new Error("useGadgetState must be used within a GadgetProvider");
  return context;
}