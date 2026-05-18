export async function githubSearch(query: string, token: string): Promise<string> {
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return JSON.stringify(data.items.map(i => ({
    name: i.full_name,
    description: i.description,
    stars: i.stargazers_count,
    url: i.html_url
  })), null, 2);
}

export async function githubReadFile(owner: string, repo: string, path: string, token: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error(`Cannot read file: ${res.status}`);
  const data = await res.json();
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

export async function githubCreateIssue(owner: string, repo: string, title: string, body: string, token: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body })
  });
  if (!res.ok) throw new Error(`Cannot create issue: ${res.status}`);
  const data = await res.json();
  return `Issue created: ${data.html_url}`;
}
