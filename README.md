# @hipstersantos/blocknote-gadget

A customizable **BlockNote editor gadget** with collaboration support. Designed to enhance your React applications with a powerful, extensible editor featuring real-time collaboration and a modern slash-menu interface.

## ✨ Features

- 📄 **Customizable BlockNote Editor**: Extend and modify editor behavior with ease.
- 🤝 **Collaboration Support**: Enable real-time collaborative editing.
- 🚀 **Slash Menu Integration**: Simplify content creation using the intuitive slash-menu.
- 📚 **React Compatible**: Seamlessly integrates with React 18.
- ✅ **Testing Utilities**: Preconfigured with @testing-library for smooth testing.

## 📦 Installation

Ensure you have `react` and `react-dom` installed in your project.

```bash
npm install @hipstersantos/blocknote-gadget
```


### Step 1: Create a Wrapper HTML
Create `public/gadget.html` in your project:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BlockNote Gadget</title>
</head>
<body>
  <div id="gadget-root"></div>
  <script src="https://unpkg.com/@hipstersantos/blocknote-gadget@1.0.0/dist/index.js"></script>
</body>
</html>
```

### Step 2: Embed in Your App
Embed the gadget in an iframe:

```jsx
import { useEffect, useRef } from "react";

function App() {
  const iframeRef = useRef(null);

  useEffect(() => {
    iframeRef.current.contentWindow.postMessage({
      type: "CONFIGURE",
      payload: {
        serverUrl: "ws://localhost:8080",
        protocol: "ws",
        initialContent: [{ type: "paragraph", content: "Start here" }]
      }
    }, "*");
  }, []);

  return <iframe ref={iframeRef} src="/gadget.html" style={{ width: "100%", height: "400px" }} />;
}

export default App;
```

### Step 3: Interact with the Gadget

**Configure**
```javascript
iframe.contentWindow.postMessage({
  type: "CONFIGURE",
  payload: {
    serverUrl: "ws://your-server",
    protocol: "ws",
    initialContent: [{ type: "paragraph", content: "Initial text" }]
  }
}, "*");
```

**Get Content**
```javascript
iframe.contentWindow.postMessage({ type: "GET_CONTENT" }, "*");
```

**Set Content**
```javascript
iframe.contentWindow.postMessage({
  type: "SET_CONTENT",
  payload: [{ type: "paragraph", content: "New content" }]
}, "*");
```

**Set Initial Content**
```javascript
iframe.contentWindow.postMessage({
  type: "SET_INITIAL_CONTENT",
  payload: [{ type: "paragraph", content: "Initial content" }]
}, "*");
```

**Register Slash Menu Item**
```javascript
iframe.contentWindow.postMessage({
  type: "REGISTER_SLASH_ITEM",
  payload: {
    title: "Insert Hello World",
    group: "Custom",
    aliases: ["hw"],
    subtext: "Adds a bold Hello World",
    block: { type: "paragraph", content: [{ type: "text", text: "Hello World", styles: { bold: true } }] }
  }
}, "*");
```

**Insert Block**
```javascript
iframe.contentWindow.postMessage({
  type: "INSERT_BLOCK",
  payload: { type: "paragraph", content: "Quick Insert" }
}, "*");
```

### Step 4: Listen for Responses

```javascript
window.addEventListener("message", (event) => {
  const { type, payload } = event.data;
  switch (type) {
    case "CONTENT_RESPONSE":
      console.log("Editor content:", payload);
      break;
    case "CONTENT_UPDATED":
      console.log("Content synced:", payload);
      break;
    case "ERROR":
      console.error("Error:", payload);
      break;
  }
});
```
## Step 5: Create a Test Project

Let’s create a simple Vite React project to test the gadget.

### Directory Structure
```
blocknote-test/
├── public/
│   └── gadget.html
├── src/
│   └── App.jsx
├── package.json
└── vite.config.js
```

### Setup Test Project

**Create Project:**
```bash
npm create vite@latest blocknote-test -- --template react
cd blocknote-test
npm install
```

**Install Gadget:**
```bash
npm install @hipstersantos/blocknote-gadget
```

If testing locally first:
```bash
npm link @hipstersantos/blocknote-gadget
```

Add `public/gadget.html` as described in **Step 1**.

**Update `src/App.jsx`:**

```javascript
import { useEffect, useRef, useState } from "react";

export default function App() {
  const iframeRef = useRef(null);
  const [content, setContent] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case "GADGET_READY":
          setIsReady(true);
          iframeRef.current.contentWindow.postMessage({
            type: "CONFIGURE",
            payload: {
              serverUrl: "ws://localhost:8080",
              protocol: "ws",
              initialContent: [{ type: "paragraph", content: "Test Project" }],
            },
          }, "*");
          break;
        case "CONTENT_RESPONSE":
        case "CONTENT_UPDATED":
          setContent(payload);
          break;
        case "ERROR":
          setError(payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div>
      <h1>BlockNote Gadget Test</h1>
      <iframe ref={iframeRef} src="/gadget.html" style={{ width: "100%", height: "400px" }} />
      <pre>{content ? JSON.stringify(content, null, 2) : "No content"}</pre>
    </div>
  );
}
```

Minimal `vite.config.js`:
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```


## 🚀 Usage

Here's a basic example to get started with `@hipstersantos/blocknote-gadget`:

```jsx
import React from "react";
import { BlockNoteEditor } from "@hipstersantos/blocknote-gadget";

const App = () => {
  return (
    <div>
      <h1>My BlockNote Editor</h1>
      <BlockNoteEditor />
    </div>
  );
};

export default App;
```

### Example with Custom Slash Menu

```jsx
import React from "react";
import { BlockNoteEditor } from "@hipstersantos/blocknote-gadget";

const customItems = [
  { label: "Insert Image", action: () => console.log("Add Image") },
  { label: "Insert Table", action: () => console.log("Add Table") },
];

const App = () => {
  return <BlockNoteEditor slashMenuItems={customItems} />;
};

export default App;
```

## 📚 API Reference

### `<BlockNoteEditor />`

| Prop               | Type            | Description                             |
|--------------------|-----------------|-----------------------------------------|
| `slashMenuItems`   | `Array<Object>` | Custom items for the slash menu.        |
| `onChange`         | `function`      | Callback fired when content changes.    |

## ✅ Testing

Ensure your components work as expected using `react-scripts`.

```bash
npm test
```

## 📄 License

MIT License © 2024 Hipster Santos

## 📣 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📊 Roadmap

- [ ] Advanced collaboration features
- [ ] Customizable themes
- [ ] Plugin system support

## 📫 Contact

For questions or feedback, reach out via [GitHub Issues](https://github.com/HipsterSantos/blocknote-gadget/issues).

