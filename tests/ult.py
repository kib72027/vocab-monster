import asyncio
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
exec(open(P+'spell.py').read().split('async def main')[0].split("P='")[0]) if False else None
MOCK=open(P+'spell.py').read().split('MOCK="""')[1].split('"""')[0]
async def ans(pg):
    ci=await pg.evaluate('window.__q().choices.findIndex(c=>c.correct)');await pg.click(f'.choice >> nth={ci}')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':420,'height':860});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(MOCK);await pg.goto('file://'+P+'shot.html');await pg.evaluate('window.__noRush=true');await pg.wait_for_timeout(400)
        await pg.click('[data-id="w8-rabbit"]');await pg.wait_for_timeout(500)
        for i in range(5):
            await ans(pg);await pg.wait_for_selector('.sheet, [data-act=nextB], .next',timeout=15000) if False else None
            await pg.wait_for_timeout(3200)
            nx=await pg.query_selector('[data-act=nextB]')
            if nx:await nx.click();await pg.wait_for_timeout(400)
        await pg.screenshot(path=P+'ul_ready.png')
        await ans(pg)
        for k,t in enumerate([700,700,700,600,500,500,400,500,900]):
            await pg.wait_for_timeout(t);await pg.screenshot(path=P+f'ul_{k}.png')
        print(errs);await b.close()
asyncio.run(main())
