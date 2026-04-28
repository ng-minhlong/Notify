// useMinimizeWindow.ts
import { useCallback } from "react";
import { useMinimizeWindow } from "./MinimizeWindowContext";

export function useOpenMinimizeWindow(getEditorText: () => string) {
  const { miniWindowRef, setMiniWindow } = useMinimizeWindow();

  const closeMiniWindow = useCallback(() => {
    if (miniWindowRef.current && !miniWindowRef.current.closed) {
      miniWindowRef.current.close();
      setMiniWindow(null);
    }
  }, [miniWindowRef, setMiniWindow]);

  const openMinimizeWindow = useCallback(() => {
    closeMiniWindow();
    const miniWindow = window.open(
      '',
      'MiniEditor',
      'width=400,height=350,left=200,top=200,resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no'
    );
    if (!miniWindow) return;
    setMiniWindow(miniWindow);

    const style = `
      body { font-family: sans-serif; background: #222; color: #fff; margin: 0; padding: 0; }
      #header { display: flex; justify-content: space-between; align-items: center; background: #333; padding: 8px 12px; cursor: move; border-radius: 8px 8px 0 0; }
      #mini-toolbar { display: flex; gap: 6px; margin: 10px 0; }
      textarea { width: 96%; margin: 0 2%; height: 120px; border-radius: 6px; border: none; padding: 8px; font-size: 1rem; background: #181818; color: #fff; }
      button { background: #444; color: #fff; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer; }
      button:hover { background: #666; }
    `;
    const toolbarHTML = `
      <div id="mini-toolbar">
        <button id="copyBtn">Copy</button>
        <button id="summaryBtn">Summary</button>
        <button id="aiBtn">Ask AI</button>
        <button id="closeBtn">✕</button>
      </div>
    `;
    miniWindow.document.write(`
      <html><head><title>Mini Editor</title><style>${style}</style></head><body>
      <div id="header"><span>Mini Editor</span></div>
      ${toolbarHTML}
      <textarea id="miniText"></textarea>
      </body></html>
    `);
    miniWindow.document.close();

    // Set initial value
    const mainText = getEditorText();
    const miniText = miniWindow.document.getElementById('miniText') as HTMLTextAreaElement;
    if (miniText) miniText.value = mainText;

    // Sync: main -> mini
    const syncToMini = () => {
      if (miniWindow && !miniWindow.closed) {
        const miniText = miniWindow.document.getElementById('miniText') as HTMLTextAreaElement;
        if (miniText) miniText.value = getEditorText();
      }
    };
    window.addEventListener('input', syncToMini, true);

    // Copy button
    const copyBtn = miniWindow.document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        miniText && navigator.clipboard.writeText(miniText.value);
      });
    }
    // Summary button
    const summaryBtn = miniWindow.document.getElementById('summaryBtn');
    if (summaryBtn) {
      summaryBtn.addEventListener('click', () => {
        alert('Summary feature is only available in main window.');
      });
    }
    // AI button
    const aiBtn = miniWindow.document.getElementById('aiBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        alert('Ask AI feature is only available in main window.');
      });
    }
    // Close button
    const closeBtn = miniWindow.document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeMiniWindow();
      });
    }

    // Drag header (fix: use screenX/screenY and moveTo)
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    const header = miniWindow.document.getElementById('header');
    if (header) {
      header.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        dragOffsetX = e.screenX - miniWindow.screenX;
        dragOffsetY = e.screenY - miniWindow.screenY;
      });
      miniWindow.document.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isDragging) return;
        miniWindow.moveTo(e.screenX - dragOffsetX, e.screenY - dragOffsetY);
      });
      miniWindow.document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }

    // Auto close if parent closes or navigates
    const cleanup = () => closeMiniWindow();
    window.addEventListener('beforeunload', cleanup);
    miniWindow.addEventListener('beforeunload', () => {
      setMiniWindow(null);
      window.removeEventListener('beforeunload', cleanup);
    });
  }, [closeMiniWindow, getEditorText, setMiniWindow]);

  return { openMinimizeWindow, closeMiniWindow };
}
