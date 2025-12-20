from playwright.sync_api import sync_playwright

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate
        page.goto("http://localhost:8000/index.html")

        # Wait for biome selection
        page.wait_for_selector("#biome-selection-modal")

        # Click Temperate Biome to start
        page.click("button[data-biome='temperate']")

        # Wait for game container
        page.wait_for_selector("#game-container", state="visible")

        # Wait for player character
        page.wait_for_selector("#player-character", state="visible")

        # Move a bit to show interaction possibility
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(200)
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)

        # Plant something
        page.click("#crop-selections button:nth-child(1)")
        page.keyboard.press("Space")
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path="verification/visual_check.png")
        print("Screenshot saved to verification/visual_check.png")

        browser.close()

if __name__ == "__main__":
    verify_visuals()
