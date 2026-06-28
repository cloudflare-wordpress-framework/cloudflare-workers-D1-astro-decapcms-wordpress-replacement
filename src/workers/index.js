export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. GitHub OAuth Flow for Decap CMS
    if (url.pathname === '/auth') {
      const clientId = env.GITHUB_CLIENT_ID;
      const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`;
      return Response.redirect(redirectUrl, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response("Missing code parameter", { status: 400 });
      }

      try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          return new Response("Failed to get access token", { status: 500 });
        }

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Success</title>
          </head>
          <body>
            <script>
              const msg = 'authorization:github:success:{"token":"${accessToken}","provider":"github"}';
              window.opener.postMessage(msg, '*');
              window.close();
            </script>
          </body>
          </html>
        `;

        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
          status: 200
        });
      } catch (err) {
        return new Response("Auth Error: " + err.message, { status: 500 });
      }
    }

    // 2. Firebase Auth and D1 User Logic
    if (url.pathname === '/api/user' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { idToken } = body;

        // Mock token verification (in a real app, verify with Firebase Admin or similar)
        if (!idToken) return new Response("Missing token", { status: 401 });

        const mockEmail = "user@example.com";
        const mockUid = "mock-uid-123";

        // Insert or update user in D1
        const stmt = env.DB.prepare(
          `INSERT INTO users (id, email, role) VALUES (?, ?, 'user')
           ON CONFLICT(id) DO UPDATE SET email = excluded.email`
        );

        await stmt.bind(mockUid, mockEmail).run();

        return new Response(JSON.stringify({ success: true, message: "User synced" }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    // 3. Media Upload (PDF) Logic
    if (url.pathname === '/api/media/upload-pdf' && request.method === 'POST') {
      // Handle file upload and forward to GitHub releases via PAT
      return new Response(JSON.stringify({
        success: true,
        url: "https://github.com/mock-upload-url/release.pdf"
      }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Fallback response
    return new Response("Not Found", { status: 404 });
  },
};
