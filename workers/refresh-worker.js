export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    const owner = env.GITHUB_OWNER || "Yiming-Gao";
    const repo = env.GITHUB_REPO || "ca-rto-newsfeed";
    const workflow = env.GITHUB_WORKFLOW || "manual-refresh.yml";
    const token = env.GITHUB_TOKEN;

    if (!token) {
      return new Response("Missing GITHUB_TOKEN", {
        status: 500,
        headers: corsHeaders
      });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "ca-rto-newsfeed-refresh-worker",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({ ref: "main" })
      }
    );

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
};
