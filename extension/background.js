chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-applypilot',
    title: 'Send selected post to ApplyPilot',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'send-to-applypilot' && info.selectionText) {
    const targetUrl = `https://applypilot.vercel.app/apply?text=${encodeURIComponent(
      info.selectionText
    )}`;
    chrome.tabs.create({ url: targetUrl });
  }
});
