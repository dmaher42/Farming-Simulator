from playwright.sync_api import sync_playwright

def verify_movement():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:8000/index.html")

        # Wait for biome selection
        page.wait_for_selector("#biome-selection-modal")

        # Click Temperate Biome to start
        page.click("button[data-biome='temperate']")

        # Wait for game container
        page.wait_for_selector("#game-container", state="visible")

        # Wait for player character
        page.wait_for_selector("#player-character", state="visible")

        # Check initial player position (Plot 0)
        player_el = page.query_selector("#player-character")
        assert player_el is not None, "Player character element not found!"

        # Check parent is plot 0
        parent_plot_id = player_el.evaluate("el => el.parentElement.dataset.plotId")
        assert parent_plot_id == "0", f"Player should be in plot 0, but is in {parent_plot_id}"

        print("Initial position verified.")

        # Move Right
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(200) # Wait for UI update

        # Verify Position 1
        player_el = page.query_selector("#player-character")
        parent_plot_id = player_el.evaluate("el => el.parentElement.dataset.plotId")
        assert parent_plot_id == "1", f"Player should be in plot 1 after moving right, but is in {parent_plot_id}"
        print("Move Right verified.")

        # Move Down (Index + 8) -> 9
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)

        player_el = page.query_selector("#player-character")
        parent_plot_id = player_el.evaluate("el => el.parentElement.dataset.plotId")
        assert parent_plot_id == "9", f"Player should be in plot 9 after moving down, but is in {parent_plot_id}"
        print("Move Down verified.")

        # Select Wheat (first crop)
        # Click the first crop button
        page.click("#crop-selections button:nth-child(1)")

        # Now press Space to plant in Plot 9
        page.keyboard.press("Space")
        page.wait_for_timeout(500)

        # Check if plot 9 is planted
        plot_class = page.evaluate("document.querySelector('.plot[data-plot-id=\"9\"]').className")
        assert "planted" in plot_class, "Plot 9 should be planted after selecting crop and pressing Space"
        print("Planting via Space verified.")

        # Now pressing space on a planted plot should open modal
        page.keyboard.press("Space")
        page.wait_for_timeout(500)

        # Check modal visibility
        modal_visible = page.is_visible("#plot-modal")
        assert modal_visible, "Plot modal should be visible after pressing Space on planted plot"
        print("Opening modal via Space verified.")

        browser.close()

if __name__ == "__main__":
    verify_movement()
