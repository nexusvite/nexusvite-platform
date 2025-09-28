const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    // Test Nexusvite Platform on port 6100
    console.log('Testing Nexusvite Platform on http://localhost:6100...');
    const platformPage = await context.newPage();

    try {
      await platformPage.goto('http://localhost:6100', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('✅ Platform loaded successfully on port 6100');
      await platformPage.screenshot({ path: 'platform-6100.png' });
      console.log('Screenshot saved as platform-6100.png');

      // Check page title or content
      const title = await platformPage.title();
      console.log(`Platform page title: ${title}`);
    } catch (error) {
      console.error('❌ Failed to load platform:', error.message);
      if (error.message.includes('ERR_UNSAFE_PORT')) {
        console.error('Port 6100 is blocked as unsafe!');
      }
    }

    // Test Motia on port 3000
    console.log('\nTesting Motia Framework on http://localhost:3000...');
    const motiaPage = await context.newPage();

    try {
      await motiaPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('✅ Motia loaded successfully on port 3000');
      await motiaPage.screenshot({ path: 'motia-3000.png' });
      console.log('Screenshot saved as motia-3000.png');

      // Check page title or content
      const title = await motiaPage.title();
      console.log(`Motia page title: ${title}`);
    } catch (error) {
      console.error('❌ Failed to load Motia:', error.message);
    }

    // Keep browser open for 5 seconds to observe
    await platformPage.waitForTimeout(5000);

  } finally {
    await browser.close();
    console.log('\nTest completed.');
  }
})();