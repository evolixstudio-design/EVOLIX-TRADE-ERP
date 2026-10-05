import { test, expect } from '@playwright/test';

test.describe('Module 02 E2E', () => {
  // Login before testing
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    // wait for dashboard
    await expect(page.locator('text=EVOLIX Trade ERP').first()).toBeVisible({ timeout: 10000 });
  });

  test('Organization Lifecycle', async ({ page }) => {
    // 1. Go to organizations
    await page.click('text=Organizations');
    await expect(page.locator('h1')).toHaveText('Organization Management');

    // 2. Search
    await page.fill('input[placeholder="Search organizations..."]', 'EVOLIX Demo');
    await expect(page.locator('text=EVOLIX Demo Organization').first()).toBeVisible();
    await page.fill('input[placeholder="Search organizations..."]', '');

    // 3. Create Org
    const randomCode = `O-TEST-${Math.floor(Math.random() * 1000)}`;
    await page.click('button:has-text("Create Organization")');
    await page.locator('label:text-is("Code") ~ input').fill(randomCode);
    await page.locator('label:text-is("Name") ~ input').fill('Test Org E2E');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator(`text=${randomCode}`).first()).toBeVisible();

    // 4. Disable Org
    page.on('dialog', dialog => dialog.accept());
    const row = page.locator(`tr:has-text("${randomCode}")`);
    const buttons = row.locator('button');
    // Assuming edit is first, toggle is second.
    await buttons.nth(1).click();
    // Verify toast or state change - wait a moment
    await page.waitForTimeout(500);

    // 5. Companies
    await page.click('text=Companies');
    await expect(page.locator('h1')).toHaveText('Company Management');
    const compCode = `C-TEST-${Math.floor(Math.random() * 1000)}`;
    await page.click('button:has-text("Create Company")');
    // Select org
    await page.locator('.modal-content select').first().selectOption({ index: 1 });
    await page.locator('label:text-is("Code") ~ input').fill(compCode);
    await page.locator('label:text-is("Legal Name") ~ input').fill('Test Company E2E');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator(`text=${compCode}`).first()).toBeVisible();

    // 6. Branches
    await page.click('text=Branches');
    await expect(page.locator('h1')).toHaveText('Branch Management');
    const brCode = `B-TEST-${Math.floor(Math.random() * 1000)}`;
    await page.click('button:has-text("Create Branch")');
    await page.locator('.modal-content select').first().selectOption({ index: 1 });
    await page.locator('label:text-is("Code") ~ input').fill(brCode);
    await page.locator('label:text-is("Name") ~ input').fill('Test Branch E2E');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator(`text=${brCode}`).first()).toBeVisible();

    // 7. Godowns
    await page.click('text=Godowns');
    await expect(page.locator('h1')).toHaveText('Godown Management');
    const gdCode = `G-TEST-${Math.floor(Math.random() * 1000)}`;
    await page.click('button:has-text("Create Godown")');
    await page.locator('.modal-content select').first().selectOption({ index: 1 });
    await page.locator('label:text-is("Code") ~ input').fill(gdCode);
    await page.locator('label:text-is("Name") ~ input').fill('Test Godown E2E');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator(`text=${gdCode}`).first()).toBeVisible();

    // 8. Financial Years
    await page.click('text=Financial Years');
    await expect(page.locator('h1')).toHaveText('Financial Year Management');
    await page.click('button:has-text("Create Financial Year")');
    await page.locator('.modal-content select').first().selectOption({ index: 1 });
    const randomYear = 2030 + Math.floor(Math.random() * 50);
    const fyLabel = `FY ${randomYear}-${randomYear + 1}`;
    await page.locator('label:text-is("Label") ~ input').fill(fyLabel);
    await page.locator('label:text-is("Start Date") ~ input').fill(`${randomYear}-04-01`);
    await page.locator('label:text-is("End Date") ~ input').fill(`${randomYear + 1}-03-31`);
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    await expect(page.locator(`text=${fyLabel}`).first()).toBeVisible();

    // 9. Overlapping FY Reject
    await page.click('button:has-text("Create Financial Year")');
    await page.locator('.modal-content select').first().selectOption({ index: 1 }); // Same company
    await page.locator('label:text-is("Label") ~ input').fill('FY Overlap');
    await page.locator('label:text-is("Start Date") ~ input').fill(`${randomYear}-10-01`);
    await page.locator('label:text-is("End Date") ~ input').fill(`${randomYear + 1}-09-30`);
    await page.locator('form button[type="submit"]').click();
    // Toast should show overlap error
    await expect(page.locator('text=overlaps with existing')).toBeVisible();
    await page.click('button:has-text("Cancel")'); // Close modal
  });
});
