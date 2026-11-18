import asyncio,re
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':420,'height':860});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script("localStorage.setItem('reading-plus-vocab-v1',JSON.stringify({g:{inv:{potion:2,crystal:1,note:0}}}))")
        await pg.goto('file://'+P+'shot.html');await pg.evaluate('window.__noRush=true');await pg.wait_for_timeout(500)
        await pg.screenshot(path=P+'q_home.png',full_page=True)
        await pg.click('[data-id="w18-night"]');await pg.wait_for_timeout(900)
        t=await pg.inner_text('.qcard');print(repr(t))
        print(await pg.evaluate("[window.__q().type,window.__q().t.exs.length,window.__q().t.defs.length]"))
        # wrong answer then potion
        ci=await pg.evaluate('window.__q().choices.findIndex(c=>!c.correct)');await pg.click(f'.choice >> nth={ci}');await pg.wait_for_timeout(900)
        print('hearts after wrong',await pg.evaluate("document.querySelector('.hud .bar.hp span').textContent"))
        await pg.wait_for_selector('[data-act=nextB]',timeout=15000);await pg.click('[data-act=nextB]');await pg.wait_for_timeout(900)
        await pg.click('button[data-act=potion]');await pg.wait_for_timeout(400)
        print('hearts after potion',await pg.evaluate("document.querySelector('.hud .bar.hp span').textContent"),await pg.evaluate("document.querySelector('button[data-act=potion] em').textContent"))
        await pg.screenshot(path=P+'q_battle.png')
        print(errs);await b.close()
asyncio.run(main())
