document.getElementById('activate-fm-button').addEventListener('click', () => {
    // Send a message to the background script to trigger content script injection
    chrome.runtime.sendMessage({ action: 'activateFM' });
  });