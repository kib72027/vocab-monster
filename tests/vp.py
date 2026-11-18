import asyncio,sys
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
VPS={'phone':(390,844),'tablet':(820,1180),'desk':(1366,800)}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for n,(w,h) in VPS.items():
            pg=await b.new_page(viewport={'width':w,'height':h});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file://'+P+'shot.html');await pg.wait_for_timeout(500)
            await pg.screenshot(path=P+f'vp_{n}_home.png')
            await pg.click('[data-act=heroes]');await pg.wait_for_timeout(300)
            await pg.click('[data-id=h3]');await pg.wait_for_timeout(200)
            await pg.screenshot(path=P+f'vp_{n}_heroes.png',full_page=True)
            await pg.click('[data-act=goGame]');await pg.wait_for_timeout(200)
            await pg.click('[data-act=coll]');await pg.wait_for_timeout(300)
            await pg.screenshot(path=P+f'vp_{n}_codex.png')
            await pg.click('[data-act=goGame]');await pg.wait_for_timeout(200)
            await pg.evaluate("window.__noRush=true");await pg.click('[data-id="w8-rabbit"]');await pg.wait_for_timeout(900)
            await pg.screenshot(path=P+f'vp_{n}_battle.png')
            print(n,errs)
            await pg.close()
        await b.close()
asyncio.run(main())
