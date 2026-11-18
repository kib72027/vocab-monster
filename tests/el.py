import asyncio,json
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1.5)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+P+'shot.html');await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{window.__noRush=true;const k='reading-plus-vocab-v1';const o=JSON.parse(localStorage.getItem(k)||'{}');o.g=o.g||{};const g=o.g;g.def=g.def||{};g.stars={};
          ['w1-office','w2-surprise'].forEach(x=>{});localStorage.setItem(k,JSON.stringify(o));}""")
        # get set ids of weeks 1,2 via DOM
        ids=await pg.evaluate("[...document.querySelectorAll('[data-act=fight]')].map(b=>b.dataset.id)")
        print(ids[:8])
        await pg.evaluate("""(ids)=>{const k='reading-plus-vocab-v1';const o=JSON.parse(localStorage.getItem(k)||'{}');const g=o.g;g.def=g.def||{};g.stars={};ids.slice(0,6).forEach(i=>{g.def[i]=1;g.stars[i]=3;});g.def.e1=1;g.stars.e1=3;g.def.e2=1;g.stars.e2=2;localStorage.setItem(k,JSON.stringify(o));}""",ids)
        await pg.reload();await pg.wait_for_timeout(600)
        await pg.evaluate("window.__noRush=true")
        await pg.screenshot(path=P+'el_home.png')
        await pg.evaluate("document.querySelector('.elitecard').scrollIntoView({block:'center'})");await pg.wait_for_timeout(300)
        await pg.screenshot(path=P+'el_home2.png')
        await pg.evaluate("document.querySelector('.bosscard').scrollIntoView({block:'center'})");await pg.wait_for_timeout(300)
        await pg.screenshot(path=P+'el_home3.png')
        await pg.click('.bosscard');await pg.wait_for_timeout(1200)
        await pg.screenshot(path=P+'el_boss.png')
        await pg.click('[data-act=goGame]');await pg.wait_for_timeout(300)
        await pg.evaluate("window.__noRush=true")
        await pg.click('.elitecard:not(.locked)');await pg.wait_for_timeout(1200)
        await pg.screenshot(path=P+'el_elite.png')
        # play: one wrong first, then correct
        for n in range(40):
            if await pg.query_selector('.rview'):break
            try: await pg.wait_for_selector('.choice:not([disabled])',timeout=15000)
            except Exception as ex:
                print('timeout at',n);await pg.screenshot(path=P+'el_fail.png');break
            q=await pg.evaluate("window.__q()")
            idx=[i for i,c in enumerate(q['choices']) if c['correct']][0]
            if n==0: idx=[i for i,c in enumerate(q['choices']) if not c['correct']][0]
            await pg.click(f'.choice[data-i="{idx}"]')
            await pg.wait_for_selector('[data-act=nextB]',timeout=20000)
            if n==0:
                await pg.screenshot(path=P+'el_wrong.png')
            nb=await pg.query_selector('[data-act=nextB]')
            for _ in range(30):
                if not await nb.is_disabled():break
                await pg.wait_for_timeout(200)
            await nb.click();await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=P+'el_reward.png',full_page=True)
        print('errs',errs)
        await b.close()
asyncio.run(main())
