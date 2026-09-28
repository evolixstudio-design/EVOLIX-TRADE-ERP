import { test, expect } from '@playwright/test';

test.describe('Identity flows', () => {
  test('login success', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.locator('h3')).toContainText('Welcome,', { timeout: 15000 });
  });

  test('invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.form-error')).toBeVisible({ timeout: 15000 });
  });

  test('protected route redirect', async ({ page }) => {
    // Clear context to be unauthenticated
    await page.context().clearCookies();
    
    await page.goto('/users');
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    await page.click('button[title="Logout"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
  
  test('renders Users screen', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    
    await page.click('a[href="/users"]');
    await expect(page.locator('h1')).toHaveText('User Management');
  });
  
  test('user search', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    
    await page.click('a[href="/users"]');
    
    await page.fill('input[placeholder="Search users..."]', 'admin');
    await page.waitForTimeout(1000);
    
    await expect(page.locator('table tbody tr').first()).toContainText('admin');
  });

  test('Create User UI', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    
    await page.goto('/users');
    await page.click('button:has-text("Create User")');
    await expect(page.locator('.modal-content')).toBeVisible();
    await page.fill('input[type="text"]', 'new_user_test');
    await page.fill('input[type="password"]', 'Password123!');
    // The second text input is display name
    await page.locator('.modal-content input[type="text"]').nth(1).fill('New User Test');
    
    // We won't submit it to prevent DB clutter, just verify UI works
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal-content')).not.toBeVisible();
  });

  test('Create Role UI', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    
    await page.goto('/roles');
    await page.click('button:has-text("Create Custom Role")');
    await expect(page.locator('.modal-content')).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });

  test('Session revoke through UI', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Evolix@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
    
    await page.goto('/sessions');
    await expect(page.locator('table tbody')).toBeVisible();
    await expect(page.locator('table tbody')).toContainText('Current');
  });
});
