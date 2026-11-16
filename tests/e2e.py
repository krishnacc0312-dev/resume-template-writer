import asyncio, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(viewport={"width":1360,"height":950}, accept_downloads=True)
        pg = await ctx.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        await pg.goto("http://localhost:3100/")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path="tests/out/home.png")
        await pg.click(".tpl >> nth=8")
        await pg.set_input_files("input[type=file]", "tests/fixtures/sravan.pdf")
        await pg.click("text=Convert resume")
        await pg.wait_for_selector(".work", timeout=20000)
        await pg.wait_for_selector(".pages canvas", timeout=20000)
        await pg.wait_for_timeout(1000)
        print("CHECK:", (await pg.inner_text(".check")).replace("\n"," / "))
        await pg.screenshot(path="tests/out/result.png", full_page=False)
        # edit a bullet -> should flag
        ta = pg.locator(".client textarea").nth(1)
        await ta.fill("Built reusable React components (edited).")
        await pg.click("h1")
        await pg.wait_for_timeout(1500)
        print("CHECK2:", (await pg.inner_text(".check")).replace("\n"," / ")[:300])
        # delete a summary item -> missing appears
        await pg.locator(".panel >> nth=1").locator("button[aria-label=Delete]").first.click()
        await pg.wait_for_timeout(800)
        print("MISSING PANEL:", (await pg.locator(".panel >> nth=0").inner_text())[:200].replace("\n"," / "))
        # re-add via select
        await pg.locator(".loose select").first.select_option("summary")
        await pg.wait_for_timeout(1200)
        async with pg.expect_download() as d1:
            await pg.click("text=Download Word")
        dl = await d1.value; await dl.save_as("tests/out/out.docx"); print("docx", dl.suggested_filename)
        async with pg.expect_download() as d2:
            await pg.click("text=Download PDF")
        dl = await d2.value; await dl.save_as("tests/out/out.pdf"); print("pdf", dl.suggested_filename)
        await pg.screenshot(path="tests/out/result2.png", full_page=True)
        print("ERRORS", errs)
        await b.close()
os.makedirs("tests/out", exist_ok=True)
asyncio.run(main())
