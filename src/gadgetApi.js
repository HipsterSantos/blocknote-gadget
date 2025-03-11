import { filterSuggestionItems } from "@blocknote/core";
import { useGadgetState } from "./state";

export class GadgetApi {
  constructor(editor) {
    this.editor = editor;
    this.ws = null;
    this.connectToServer();
    window.addEventListener("message", this.handleParentMessage.bind(this));
  }

  // Access global state
  getState() {
    return useGadgetState().state;
  }

  getDispatch() {
    return useGadgetState().dispatch;
  }

  // Post message to parent
  postToParent(data) {
    window.parent.postMessage(data, "*");
  }

  // Event handlers
  eventHandlers = {
    CONFIGURE: async (payload) => {
      this.getDispatch()({ type: "CONFIGURE", payload });
      await this.configure(payload);
    },
    GET_CONTENT: async () => {
      const content = this.editor.document;
      this.postToParent({ type: "CONTENT_RESPONSE", payload: content });
      await this.sendToServer({ type: "CONTENT_UPDATE", content });
    },
    SET_CONTENT: async (payload) => {
      this.editor.replaceBlocks(this.editor.document, payload);
      await this.sendToServer({ type: "CONTENT_SET", content: payload });
    },
    SET_INITIAL_CONTENT: async (payload) => {
      this.getDispatch()({ type: "SET_INITIAL_CONTENT", payload });
      this.editor.replaceBlocks(this.editor.document, payload);
      this.postToParent({ type: "INITIAL_CONTENT_SET" });
    },
    REGISTER_SLASH_ITEM: async (payload) => {
      this.getDispatch()({ type: "REGISTER_SLASH_ITEM", payload });
      this.postToParent({ type: "SLASH_ITEM_REGISTERED", payload: payload.title });
    },
    INSERT_BLOCK: async (payload) => {
      this.insertBlock(payload);
      await this.sendToServer({ type: "BLOCK_INSERTED", content: this.editor.document });
    },
  };

  async handleParentMessage(event) {
    const { type, payload } = event.data || {};
    const handler = this.eventHandlers[type];
    if (handler) {
      try {
        await handler(payload);
      } catch (error) {
        this.postToParent({ type: "ERROR", payload: `Handler error: ${error.message}` });
      }
    } else if (type) {
      this.postToParent({ type: "ERROR", payload: `Unknown event type: ${type}` });
    }
  }

  async configure() {
    const { serverUrl, protocol } = this.getState();
    await this.connectToServer(serverUrl, protocol);
  }

  async connectToServer(serverUrl, protocol) {
    if (this.ws) {
      this.ws.close();
      await new Promise((resolve) => (this.ws.onclose = resolve));
    }
    if (protocol === "ws") {
      this.ws = new WebSocket(serverUrl);
      await new Promise((resolve, reject) => {
        this.ws.onopen = () => {
          this.getDispatch()({ type: "SERVER_CONNECTED" });
          this.postToParent({ type: "SERVER_CONNECTED" });
          resolve();
        };
        this.ws.onerror = (err) => {
          this.getDispatch()({ type: "SERVER_ERROR", payload: `WebSocket error: ${err.message}` });
          this.postToParent({ type: "ERROR", payload: `WebSocket error: ${err.message}` });
          reject(err);
        };
      });
      this.ws.onmessage = (msg) => this.handleServerMessage(JSON.parse(msg.data));
    }
  }

  async handleServerMessage(data) {
    if (data.type === "CONTENT_UPDATE" && JSON.stringify(data.content) !== JSON.stringify(this.editor.document)) {
      this.editor.replaceBlocks(this.editor.document, data.content);
      this.postToParent({ type: "CONTENT_UPDATED", payload: data.content });
    }
  }

  async sendToServer(data) {
    const { protocol } = this.getState();
    if (protocol === "ws" && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  registerSlashItem(payload) {
    // Already handled by reducer
  }

  getSlashMenuItems(query) {
    const { slashItems } = this.getState();
    const customItems = Array.from(slashItems.values()).map((item) => ({
      ...item,
      onItemClick: () => this.insertBlock(item.block),
    }));
    return filterSuggestionItems(customItems, query);
  }

  insertBlock(block) {
    const currentBlock = this.editor.getTextCursorPosition().block;
    this.editor.insertBlocks([block], currentBlock, "after");
  }

  destroy() {
    if (this.ws) this.ws.close();
    window.removeEventListener("message", this.handleParentMessage.bind(this));
  }
}