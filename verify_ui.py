from playwright.sync_api import sync_playwright
import time

def capture_tv_gallery():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto('http://localhost:3004')
            page.wait_for_load_state('networkidle')

            # Scroll to the gallery section
            gallery = page.locator('#galeria')
            gallery.scroll_into_view_if_needed()

            # Wait for animations and content to load
            time.sleep(3)

            page.screenshot(path='tv_gallery_updated.png')
            page.screenshot(path='full_page_gallery.png', full_page=True)
            print("Screenshots captured successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    capture_tv_gallery()
