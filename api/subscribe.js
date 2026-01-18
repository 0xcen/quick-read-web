export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'QuickRead <hello@quickread.app>',
        to: email,
        subject: 'Your QuickRead Download Link',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 20px;">QuickRead</h1>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Thanks for trying QuickRead. Here's your download link:
            </p>
            <a href="https://github.com/0xcen/quick-read/releases/latest" 
               style="display: inline-block; background: #ff3b30; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Download QuickRead
            </a>
            <p style="color: #999; font-size: 14px; margin-top: 40px; line-height: 1.6;">
              After downloading:<br>
              1. Open the DMG and drag QuickRead to Applications<br>
              2. Run: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">xattr -cr /Applications/QuickRead.app</code><br>
              3. Launch and press ⌘⇧R on any article
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              <a href="https://github.com/0xcen/quick-read" style="color: #666;">View on GitHub</a>
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
