import asyncio
from playwright.async_api import async_playwright
P='/tmp/claude-0/-home-claude/a3c55631-b360-5eee-bc8c-a284734dea09/scratchpad/'
MOCK="""
window.__log=[];
(function(){const q=[];let busy=false;
 window.SpeechSynthesisUtterance=function(t){this.text=t;};
 Object.defineProperty(window,'speechSynthesis',{value:{getVoices(){return[]},cancel(){q.length=0;},speak(u){q.push(u);pump();}},configurable:true});
 function pump(){if(busy||!q.length)return;busy=true;const u=q.shift();window.__log.push([Math.round(performance.now()),u.text]);u.onstart&&u.onstart();setTimeout(()=>{busy=false;pump();},500);}
})();"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':420,'height':860})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(MOCK)
        await pg.goto('file://'+P+'shot.html');await pg.wait_for_timeout(400)
        await pg.click('[data-id="w8-rabbit"]');await pg.wait_for_timeout(500)
        await pg.screenshot(path=P+'sp_0.png')
        # pick correct: find via page state? click each until... use keyboard hack: evaluate correct index
        idx=await pg.evaluate("(()=>{const c=[...document.querySelectorAll('.choice')];return 0})()")
        ci=await pg.evaluate('window.__q().choices.findIndex(c=>c.correct)');await pg.click(f'.choice >> nth={ci}')
        for k,t in enumerate([200,450,450,450,450,600]):
            await pg.wait_for_timeout(t);await pg.screenshot(path=P+f'sp_{k+1}.png')
        print(await pg.evaluate("window.__log"),errs)
        await b.close()
asyncio.run(main())
