const STORAGE_KEY = 'apiToken';

// Returns the active tab if it is on the site, otherwise null
async function getSiteTab() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return null;
    return tab;
}

const getApiToken = async () => {
    const tab = await getSiteTab();
    if (!tab) return null;

    const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key) => localStorage.getItem(key),
        args: [STORAGE_KEY],
    });

    return result.result;
}

export { getApiToken, getSiteTab };
