// Chrome only exposes `chrome`, whose MV3 APIs return promises just like Firefox's `browser`
globalThis.browser ??= chrome;

const STORAGE_KEY = 'apiToken';
const SITES_KEY = 'sites';
const DEFAULT_SITES = ['https://code.iiit.ac.in'];

// Returns the active tab if it is on the site, otherwise null
async function getSiteTab() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return null;
    return tab;
}

// Turns user input like "git.example.com" or a full URL into "https://git.example.com", or null if invalid
function toOrigin(input) {
    try {
        const url = new URL(/^https?:\/\//.test(input) ? input : `https://${input}`);
        return url.protocol === 'https:' ? url.origin : null;
    } catch {
        return null;
    }
}

async function getSites() {
    const stored = await browser.storage.local.get(SITES_KEY);
    return stored[SITES_KEY] ?? DEFAULT_SITES;
}

async function setSites(sites) {
    await browser.storage.local.set({ [SITES_KEY]: sites });
}

async function isEnabledSite(url) {
    const origin = toOrigin(url);
    return origin !== null && (await getSites()).includes(origin);
}

// Reads the token from the given tab's site, or from the active tab if no tabId is given
const getApiToken = async (tabId) => {
    if (tabId === undefined) {
        const tab = await getSiteTab();
        if (!tab) return null;
        tabId = tab.id;
    }

    const [result] = await browser.scripting.executeScript({
        target: { tabId },
        func: (key) => localStorage.getItem(key),
        args: [STORAGE_KEY],
    });

    return result.result;
}

export { getApiToken, getSiteTab, toOrigin, getSites, setSites, isEnabledSite };
