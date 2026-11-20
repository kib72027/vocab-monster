# 全部詞彙英文解釋與例句檢查

## 檢查範圍

已檢查 `data/vocab` 中所有含英文解釋（`defs`）與例句（`exs`）的詞彙資料：

- `new_in1.json`、`new_in2.json`、`new_in3.json`
- `new_out1.json`、`new_out2.json`、`new_out3.json`
- `old_in1.json`、`old_in2.json`、`old_in3.json`、`old_in4.json`
- `old_out1.json`、`old_out2.json`、`old_out3.json`、`old_out4.json`

輸入檔與輸出檔都納入檢查，因為兩者文字可能不同。`existing.json` 與 `newlessons.json` 沒有 `defs`／`exs` 欄位，不在這次檢查範圍。

`new_in1.json` 已完成 60 項修訂，詳見[該檔檢查紀錄](./new_in1_review.md)。其他檔案中沒有列在下表的內容，未發現需要優先修改的文法、自然度、詞義或小學生可讀性問題。

欄位編號 `D1`–`D3` 代表 `defs` 的第 1–3 項；`E1`–`E3` 代表 `exs` 的第 1–3 項。下表記錄原文與修訂稿；表中的 21 項修訂已套用到對應 JSON。

## 已套用修改

| 檔案 | 單字 | 欄位 | 原文 | 建議修改 | 原因 |
|---|---|---|---|---|---|
| `new_in2.json` | worst | D1 | the most bad of all | the worst of all | `most bad` 文法錯誤。 |
| `new_in2.json` | worst | D3 | the one that is the very poor of all | the one that is the worst of all | 原句文法錯誤且不自然。 |
| `new_in2.json` | giggle | E2 | I could not stop myself from trying to giggle in class. | I could not stop giggling in class. | `stop trying to giggle` 改變原意且不自然。 |
| `new_in2.json` | judging | D3 | Giving prizes after seeing people's work | Deciding who wins after seeing people's work | `judging` 是評審／評估，不是頒獎。 |
| `new_in3.json` | unless | D3 | Except in the case that something happens | Except if something happens | 原句彆扭，不易理解 `unless` 的意思。 |
| `new_in3.json` | bet | D2 | To promise a prize that you will win or be right | To risk something on what you think will happen | 原解釋把 bet 說成承諾獎品，詞義不準確。 |
| `new_in3.json` | powder | E2 | Mom put chocolate powder in the milk. | Mom put cocoa powder in the milk. | `cocoa powder` 是更自然、準確的說法。 |
| `new_in3.json` | nature | D1 | Plants, animals, and everything outdoors not made by people | Plants, animals, and the natural world around us | 原解釋不自然，且不必要地限縮為戶外事物。 |
| `new_out2.json` | offer | D3 | to ask if someone wants a gift or help | to ask if someone wants something or needs help | `offer` 不限於提供禮物或幫助。 |
| `new_out2.json` | offer | E1 | I will offer Mosh a treat if he sits. | I will offer Mosh a treat when he sits. | 此處用 `when` 表達狗坐下後給點心較自然。 |
| `new_out3.json` | favorite | D3 | Loved more than anything else of its kind | Liked more than all the others of its kind | `favorite` 指最喜歡，不一定是愛得最深。 |
| `new_out3.json` | drowned | E1 | The little flame drowned in the spilled water. | The spilled water drowned the little flame. | 改成較自然、清楚的主動句。 |
| `new_out3.json` | drowned | E2 | The flowers drowned in the heavy rain. | The flood drowned the flowers. | 原句搭配不夠自然，建議明確描述造成淹沒的主體。 |
| `new_out3.json` | drowned | E3 | Carlos's cereal drowned in too much milk. | Spilled milk drowned Carlos's cereal. | 改用較自然的主動句並說明造成淹沒的主體。 |
| `old_out1.json` | route | E2 | The mail man walks the same route every day. | The mail carrier follows the same route every day. | `mailman` 通常合寫；`follows a route` 搭配較自然。 |
| `old_out2.json` | disguised | D1 | Dressed up so no one knows who | Dressed up so no one knows who the person really is. | 原解釋不完整。 |
| `old_out3.json` | climb | D3 | get into a high place slowly | move up to a higher place using your hands and feet | 原句不自然且意思過度狹窄。 |
| `old_out3.json` | without | D3 | with no one or nothing | with no one or nothing present | 補足句意，使解釋完整自然。 |
| `old_out4.json` | deserved | D2 | earned a good or bad thing | earned something because of what you did | 原句不自然，建議說明是依據行為而得到。 |
| `old_out4.json` | deserved | D3 | was fair to get, good or bad | was right to get something, whether good or bad | 原句文法與搭配不自然。 |
| `old_out4.json` | spaceship | D3 | a big ship that goes to the stars | a vehicle that travels through space | `ship` 和 `goes to the stars` 容易造成錯誤理解。 |

## 檢查結果摘要

- `new_in1.json`：60 項建議已套用，見[修訂明細](./new_in1_review.md)。
- 其他含英文資料的檔案：上表列出的 21 項修訂已套用。
- 其他已檢查內容：未發現需要優先修改的項目。
