import asyncio
from playwright.async_api import async_playwright
from PIL import Image
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ims=[]
        for h in ['h1','h2','h6','h7','h8','h10']:
            pg=await b.new_page(viewport={'width':420,'height':700});await pg.goto('file://'+P+'shot.html');await pg.wait_for_timeout(400)
            await pg.click('[data-act=heroes]');await pg.wait_for_timeout(200);await pg.click(f'[data-id={h}]');await pg.wait_for_timeout(200)
            await pg.click('[data-act=goGame]');await pg.wait_for_timeout(200);await pg.click('[data-id="w8-rabbit"]');await pg.wait_for_timeout(900)
            await pg.screenshot(path=P+f'hv_{h}.png',clip={'x':10,'y':70,'width':400,'height':350});await pg.close();ims.append(Image.open(P+f'hv_{h}.png'))
        W=Image.new('RGB',(1200,700))
        for k,i in enumerate(ims):W.paste(i,((k%3)*400,(k//3)*350))
        W.save(P+'hv.png');await b.close()
asyncio.run(main())
