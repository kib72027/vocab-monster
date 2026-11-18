import asyncio
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1.5)
        await pg.goto('file://'+P+'vocab.html');await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{const k='reading-plus-vocab-v1';const o=JSON.parse(localStorage.getItem(k)||'{}');o.g=o.g||{};const g=o.g;g.rcards={};for(let i=1;i<=96;i++)g.rcards['n'+String(i).padStart(3,'0')]=1+(i%3);localStorage.setItem(k,JSON.stringify(o));}""")
        await pg.reload();await pg.wait_for_timeout(500)
        await pg.click('[data-act=coll]');await pg.wait_for_timeout(500);await pg.click('[data-t=fire]') if False else None
        await pg.screenshot(path=P+'cdx1.png')
        await pg.evaluate("window.scrollTo(0,1500)");await pg.wait_for_timeout(200)
        await pg.screenshot(path=P+'cdx2.png')
        await b.close()
asyncio.run(main())
