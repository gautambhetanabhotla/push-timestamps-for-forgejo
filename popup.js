const STORAGE_KEY = 'apiToken';
const tokenInput = document.getElementById('apiTokenInput');
const statusMessage = document.getElementById('statusMessage');
const siteInput = document.getElementById('siteInput');
const siteList = document.getElementById('siteList');

import { getApiToken, getSiteTab, toOrigin, getSites, setSites } from './helpers.js';

function showStatus(text, color) {
    statusMessage.textContent = text;
    statusMessage.style.color = color;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
}

document.getElementById('saveButton').addEventListener('click', async () => {
    const apiToken = tokenInput.value.trim();
    if (!apiToken) return;

    try {
        const tab = await getSiteTab();
        if (!tab) {
            showStatus('Open the site first.', 'red');
            return;
        }

        // Write into the site's own localStorage by running a small function in the page
        await browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: (key, value) => localStorage.setItem(key, value),
            args: [STORAGE_KEY, apiToken],
        });

        showStatus('API token saved successfully!', 'green');
    } catch (err) {
        console.error('Save failed:', err);
        showStatus('Save failed: ' + err.message, 'red');
    }
});

async function renderSites() {
    const sites = await getSites();
    siteList.replaceChildren(...sites.map((origin) => {
        const item = document.createElement('li');
        item.textContent = origin + ' ';
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', async () => {
            await setSites((await getSites()).filter((site) => site !== origin));
            try {
                await browser.permissions.remove({ origins: [`${origin}/*`] });
            } catch (err) {
                console.error('Could not revoke permission:', err);
            }
            renderSites();
        });
        item.append(removeButton);
        return item;
    }));
}

document.getElementById('addSiteButton').addEventListener('click', async () => {
    const origin = toOrigin(siteInput.value.trim());
    if (!origin) {
        showStatus('Enter a valid https site.', 'red');
        return;
    }

    // Must be the first await so the click still counts as a user gesture
    const granted = await browser.permissions.request({ origins: [`${origin}/*`] });
    if (!granted) {
        showStatus('Permission denied.', 'red');
        return;
    }

    const sites = await getSites();
    if (!sites.includes(origin)) await setSites([...sites, origin]);
    siteInput.value = '';
    renderSites();
    showStatus('Site added.', 'green');
});

// Load the saved API token from the site's localStorage when the popup is opened
document.addEventListener('DOMContentLoaded', async () => {
    renderSites();

    // Prefill the site box with the current tab's site for easy adding
    const tab = await getSiteTab();
    if (tab) siteInput.value = toOrigin(tab.url) ?? '';

    try {
        const result = await getApiToken();
        if (result) {
            tokenInput.value = result;
        }
    } catch (err) {
        console.error('Could not read API token:', err);
    }
});
