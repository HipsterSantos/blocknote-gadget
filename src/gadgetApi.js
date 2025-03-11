import { filterSuggestionItems } from "@blocknote/core";

export class GadgetApi {
  constructor(editor, config = {}) {
    this.editor = editor;
    this.serverUrl = config.serverUrl || "ws://localhost:8080";
    this.protocol = config.protocol || "ws";
    this.ws = null;
    this.customSlashItems = new Map(); // Store custom slash menu items
    this.connectToServer();
    window.addEventListener("message", this.handleParentMessage.bind(this));
  }

  // Post message to parent
  postToParent(data) {
    window.parent.postMessage(data, "*"); // Replace "*" with specific origin in production
  }

  // Event handlers
  eventHandlers = {
    CONFIGURE: async (payload) => {
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
      this.editor.replaceBlocks(this.editor.document, payload);
      this.postToParent({ type: "INITIAL_CONTENT_SET" });
    },
    REGISTER_SLASH_ITEM: async (payload) => {
      this.registerSlashItem(payload);
      this.postToParent({ type: "SLASH_ITEM_REGISTERED", payload: payload.title });
    },
    INSERT_BLOCK: async (payload) => {
      this.insertBlock(payload);
      await this.sendToServer({ type: "BLOCK_INSERTED", content: this.editor.document });
    },
  };

  // Handle parent messages
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

  // Configure server and editor
  async configure({ serverUrl, protocol, initialContent }) {
    this.serverUrl = serverUrl || this.serverUrl;
    this.protocol = protocol || this.protocol;
    if (initialContent) {
      this.editor.replaceBlocks(this.editor.document, initialContent);
    }
    await this.connectToServer();
  }

  // Connect to server (WebSocket for collaboration)
  async connectToServer() {
    if (this.ws) {
      this.ws.close();
      await new Promise((resolve) => (this.ws.onclose = resolve));
    }
    if (this.protocol === "ws") {
      this.ws = new WebSocket(this.serverUrl);
      await new Promise((resolve, reject) => {
        this.ws.onopen = () => {
          this.postToParent({ type: "SERVER_CONNECTED" });
          resolve();
        };
        this.ws.onerror = (err) => {
          this.postToParent({ type: "ERROR", payload: `WebSocket error: ${err.message}` });
          reject(err);
        };
      });
      this.ws.onmessage = (msg) => this.handleServerMessage(JSON.parse(msg.data));
    }
  }

  // Handle server messages (collaboration)
  async handleServerMessage(data) {
    if (data.type === "CONTENT_UPDATE" && JSON.stringify(data.content) !== JSON.stringify(this.editor.document)) {
      this.editor.replaceBlocks(this.editor.document, data.content);
      this.postToParent({ type: "CONTENT_UPDATED", payload: data.content });
    }
  }

  // Send to server
  async sendToServer(data) {
    if (this.protocol === "ws" && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Register custom slash menu item
  registerSlashItem({ title, group, aliases, subtext, icon, block }) {
    const item = {
      title,
      group: group || "Custom",
      aliases: aliases || [],
      subtext: subtext || "",
      icon: icon || null, // Icon as string (e.g., serialized React component)
      onItemClick: () => this.insertBlock(block),
    };
    this.customSlashItems.set(title, item);
  }

  // Get all slash menu items
  getSlashMenuItems(query) {
    const defaultItems = []; // Could include getDefaultReactSlashMenuItems(this.editor) if desired
    const customItems = Array.from(this.customSlashItems.values());
    return filterSuggestionItems([...defaultItems, ...customItems], query);
  }

  // Insert a block
  insertBlock(block) {
    const currentBlock = this.editor.getTextCursorPosition().block;
    this.editor.insertBlocks([block], currentBlock, "after");
  }

  destroy() {
    if (this.ws) this.ws.close();
    window.removeEventListener("message", this.handleParentMessage.bind(this));
  }
}