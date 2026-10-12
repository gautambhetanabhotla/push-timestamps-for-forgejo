import { getApiToken, isEnabledSite } from './helpers.js';

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Fires whenever a tab's URL changes (including history/pushState navigations)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  // Only act on the sites the user has enabled, and match the glob *commits* against the new URL
  if (changeInfo.url.includes("commits") && await isEnabledSite(changeInfo.url)) {
    const api_token = await getApiToken(tabId);
    const repo_name = changeInfo.url.split("/").slice(3, 5).join("/");
    console.log(repo_name);
    const commits = await fetch(`${new URL(changeInfo.url).origin}/api/v1/repos/${repo_name}/activities/feeds`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${api_token}`,
        'accept': 'application/json'
      }
    }).then(response => response.json()).then(data =>
      // Map each commit hash to the time the server recorded its push
      data.filter(v => v.op_type === 'commit_repo').reduce(
        (acc, curr) => {
          JSON.parse(curr.content).Commits.forEach(
            (commit) => {
              acc[commit.Sha1] = curr.created;
            }
          );
          return acc;
        }, {}
      )
    ).catch(error => {
      console.dir(error, { depth: null });
      return {};
    });

    // Runs inside the tab, where `document` is the Forgejo page
    await browser.scripting.executeScript({
      target: { tabId },
      func: async (headerText, commits) => {
        // The URL can change before the table has rendered, so wait for it
        let table = null;
        for (let i = 0; i < 50 && !(table = document.getElementById('commits-table')); i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (!table) return;

        const headerrow = table.children[0].children[0];
        const stheader = headerrow.insertBefore(
          document.createElement('th'), headerrow.children[3]
        );
        stheader.textContent = headerText;
        stheader.classList.add('two', 'wide', 'right', 'aligned');

        for (const row of table.children[1].getElementsByTagName('tr')) {
          // The commit link ends in the full hash: .../commit/<sha>
          const link = row.querySelector('a[href*="/commit/"]');
          const hash = link && link.getAttribute('href').split('/').pop();
          const cell = row.insertBefore(document.createElement('td'), row.children[3]);
          cell.classList.add('right', 'aligned');
          cell.textContent = commits[hash] ? new Date(commits[hash]).toLocaleString() : '-';
        }
      },
      args: ['Server Timestamp', commits],
    });
  }
});

