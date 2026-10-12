const rollno = 2024115013;
const api_token = '1e8463b928f892c2e9db60cf312567eb1c7f3884';

fetch(`https://code.iiit.ac.in/api/v1/repos/osn/m26-mp2-${rollno}/activities/feeds`, {
    method: 'GET',
    headers: {
        'Authorization': `token ${api_token}`,
        'accept': 'application/json'
    }
}).then(response => response.json()).then(data => {
    data = data.filter((v: any) => v.op_type === 'commit_repo');
    const commits = data.reduce(
        (acc: Array<any>, curr: any) => {
            JSON.parse(curr.content).Commits.forEach(
                (commit: any) => {
                    acc.push({
                        hash: commit.Sha1,
                        message: commit.Message,
                        author: commit.AuthorName,
                        roll_number: rollno,
                        client_timestamp: new Date(commit.Timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                        server_timestamp: new Date(curr.created).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                    });
                }
            );
            return acc;
        }, []
    )
    console.dir(commits, { depth: null });
}).catch(error => console.dir(error, { depth: null }));