document.getElementById('duplicate-video').addEventListener('click', () => {
    // Send a message to the background script to trigger content script injection
    chrome.runtime.sendMessage({ action: 'duplicateVideo' });
  });
  