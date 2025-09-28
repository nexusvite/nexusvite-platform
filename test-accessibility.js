const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testApplications() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    nexusvite: { success: false, error: null, screenshot: null },
    motia: { success: false, error: null, screenshot: null }
  };

  console.log('Testing Nexusvite platform on port 6100...');

  try {
    // Test Nexusvite on port 6100
    await page.goto('http://localhost:6100', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    // Take screenshot
    const nexusviteScreenshot = await page.screenshot({
      path: '/Users/mzaheer/Library/CloudStorage/OneDrive-Personal/Workspace/projects/My/nexusvite-platform/nexusvite-port-6100.png',
      fullPage: true
    });

    // Check if page loaded successfully
    const title = await page.title();
    const url = page.url();

    results.nexusvite = {
      success: true,
      error: null,
      screenshot: '/Users/mzaheer/Library/CloudStorage/OneDrive-Personal/Workspace/projects/My/nexusvite-platform/nexusvite-port-6100.png',
      title: title,
      url: url
    };

    console.log(`✅ Nexusvite loaded successfully`);
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);

  } catch (error) {
    results.nexusvite.error = error.message;
    console.log(`❌ Nexusvite failed to load: ${error.message}`);
  }

  console.log('\nTesting Motia on port 3000...');

  try {
    // Test Motia on port 3000
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);

    // Take screenshot
    const motiaScreenshot = await page.screenshot({
      path: '/Users/mzaheer/Library/CloudStorage/OneDrive-Personal/Workspace/projects/My/nexusvite-platform/motia-port-3000.png',
      fullPage: true
    });

    // Check if page loaded successfully
    const title = await page.title();
    const url = page.url();

    results.motia = {
      success: true,
      error: null,
      screenshot: '/Users/mzaheer/Library/CloudStorage/OneDrive-Personal/Workspace/projects/My/nexusvite-platform/motia-port-3000.png',
      title: title,
      url: url
    };

    console.log(`✅ Motia loaded successfully`);
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);

  } catch (error) {
    results.motia.error = error.message;
    console.log(`❌ Motia failed to load: ${error.message}`);
  }

  await browser.close();

  // Write results to JSON file
  fs.writeFileSync(
    '/Users/mzaheer/Library/CloudStorage/OneDrive-Personal/Workspace/projects/My/nexusvite-platform/test-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n=== FINAL RESULTS ===');
  console.log('Nexusvite (port 6100):', results.nexusvite.success ? '✅ SUCCESS' : '❌ FAILED');
  if (results.nexusvite.error) console.log('  Error:', results.nexusvite.error);

  console.log('Motia (port 3000):', results.motia.success ? '✅ SUCCESS' : '❌ FAILED');
  if (results.motia.error) console.log('  Error:', results.motia.error);

  console.log('\nScreenshots and results saved to current directory.');
}

testApplications().catch(console.error);