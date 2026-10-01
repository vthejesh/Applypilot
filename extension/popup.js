document.getElementById('openApp').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://applypilot.vercel.app/dashboard' });
});
