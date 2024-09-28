chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'duplicateVideo') {
      // Get the active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Inject content.js into the active tab
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
      });
    }
  });
  