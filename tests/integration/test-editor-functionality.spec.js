/**
 * Test editor functionality and URL updates
 */

const { test, expect } = require('@playwright/test');

test.describe('Editor Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#mainScreen', { state: 'visible' });
  });

  test('should fix tower dialog not appearing on page load', async ({ page }) => {
    // Check that tower upgrade dialog is hidden by default
    const towerDialog = page.locator('#towerUpgradeDialog');
    await expect(towerDialog).toBeHidden();
  });

  test('should navigate to editor and update URL', async ({ page }) => {
    // Click Editors button
    await page.click('button:has-text("Editors")');
    
    // Should navigate to editor URL
    await page.waitForURL('**/editor**');
    
    // Check that editor hub is visible
    await expect(page.locator('#editorHub')).toBeVisible();
    await expect(page.locator('#mainScreen')).toBeHidden();
  });

  test('should handle direct URL navigation to editor', async ({ page }) => {
    // Navigate directly to editor URL
    await page.goto('http://localhost:3000/editor?tab=level');
    
    // Should show editor
    await expect(page.locator('#editorHub')).toBeVisible();
    await expect(page.locator('#mainScreen')).toBeHidden();
  });

  test('should update URL when switching editor tabs', async ({ page }) => {
    // Navigate to editor
    await page.click('button:has-text("Editors")');
    await page.waitForSelector('#editorHub');
    
    // Click on Enemy Editor tab
    await page.click('[data-target="enemyEditorTab"]');
    
    // URL should update
    await page.waitForURL('**/editor?tab=enemy**');
  });

  test('should update URL when selecting files in editor', async ({ page }) => {
    // Navigate to level editor
    await page.goto('http://localhost:3000/editor?tab=level');
    await page.waitForSelector('#editorHub');
    
    // Wait for level editor to initialize
    await page.waitForTimeout(1000);
    
    // Check if there are existing level files to click
    const levelButtons = await page.locator('#levelEditorTab button').count();
    
    if (levelButtons > 0) {
      // Click first level file
      await page.locator('#levelEditorTab button').first().click();
      
      // URL should update with file parameter
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/file=/);
    }
  });

  test('should display save/cancel buttons in top-right of editor', async ({ page }) => {
    // Navigate to level editor
    await page.goto('http://localhost:3000/editor?tab=level');
    await page.waitForSelector('#editorHub');
    
    // Wait for editor to load
    await page.waitForTimeout(1000);
    
    // Check if there are files to edit
    const fileButtons = await page.locator('#levelEditorTab button').count();
    
    if (fileButtons > 0) {
      // Click a file to edit
      await page.locator('#levelEditorTab button').first().click();
      await page.waitForTimeout(500);
      
      // Check for save/cancel buttons in header area
      const saveButton = page.locator('button:has-text("Save")');
      const cancelButton = page.locator('button:has-text("Cancel")');
      
      await expect(saveButton).toBeVisible();
      await expect(cancelButton).toBeVisible();
      
      // Verify buttons are styled properly (green save, red cancel)
      const saveStyle = await saveButton.evaluate(el => getComputedStyle(el).backgroundColor);
      const cancelStyle = await cancelButton.evaluate(el => getComputedStyle(el).backgroundColor);
      
      expect(saveStyle).toBe('rgb(76, 175, 80)'); // Green
      expect(cancelStyle).toBe('rgb(244, 67, 54)'); // Red
    }
  });

  test('should navigate back to main from editor', async ({ page }) => {
    // Navigate to editor
    await page.goto('http://localhost:3000/editor?tab=level');
    await page.waitForSelector('#editorHub');
    
    // Click "Back to Main" button
    await page.click('#editorBackToMainBtn');
    
    // Should return to main screen
    await expect(page.locator('#mainScreen')).toBeVisible();
    await expect(page.locator('#editorHub')).toBeHidden();
    
    // URL should be updated
    await page.waitForURL('**/');
  });

  test('should maintain editor state on page refresh', async ({ page }) => {
    // Navigate to specific editor with file
    await page.goto('http://localhost:3000/editor?tab=enemy&file=drone.js');
    await page.waitForSelector('#editorHub');
    
    // Refresh the page
    await page.reload();
    
    // Should still be in enemy editor
    await expect(page.locator('#editorHub')).toBeVisible();
    await expect(page.locator('#enemyEditorTab')).toBeVisible();
    
    // URL should be preserved
    expect(page.url()).toContain('tab=enemy');
    expect(page.url()).toContain('file=drone.js');
  });
});