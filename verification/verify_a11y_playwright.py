
from playwright.sync_api import sync_playwright

def check_plots(page):
    plots = page.locator('.plot').all()
    print(f'Found {len(plots)} plots')
    if len(plots) > 0:
        plot = plots[0]
        print(f'Role: {plot.get_attribute('role')}')
        print(f'TabIndex: {plot.get_attribute('tabindex')}')
        print(f'ARIA Label: {plot.get_attribute('aria-label')}')

def verify_accessibility():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto('http://localhost:8080/index.html')

        if page.locator('#biome-selection-modal').is_visible():
            print('Biome selection modal visible. Selecting Temperate...')
            page.locator('[data-biome=temperate]').click()

        try:
            page.wait_for_selector('.plot', timeout=5000)
            check_plots(page)

            close_btn = page.locator('#close-market-btn')
            if close_btn.count() > 0:
                print(f'Close Market Button ARIA Label: {close_btn.get_attribute('aria-label')}')
            else:
                print('Close market button not found')

        except Exception as e:
            print(f'Error: {e}')
            import traceback
            traceback.print_exc()

        page.screenshot(path='verification/accessibility_check.png')
        browser.close()

if __name__ == '__main__':
    verify_accessibility()
