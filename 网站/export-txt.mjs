// 把 正文/ 导出成投稿用的纯文本（无 markdown）
// 用法：node export-txt.mjs   输出在 ../投稿版/
import { readdirSync, mkdirSync, writeFileSync, rmSync, statSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..')
const book = join(repo, '正文')
const out = join(repo, '投稿版')
const perCh = join(out, '分章')
const EOL = '\r\n'

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const RE = /^第(\d+)章([^_]*)_(.+)\.md$/
const rows = walk(book)
  .map((p) => ({ file: p, m: RE.exec(p.split(/[\\/]/).pop()) }))
  .filter((x) => x.m)
  .map((x) => ({ file: x.file, base: x.m[1], suffix: x.m[2], title: x.m[3] }))
  .sort((a, b) => Number(a.base) - Number(b.base) || a.suffix.localeCompare(b.suffix, 'zh'))
  .map((x, i) => ({ ...x, n: i + 1 }))

rmSync(out, { recursive: true, force: true })
mkdirSync(perCh, { recursive: true })

const clean = (input) => {
  const raw = input.replace(/^\uFEFF/, '')
  const body = []
  for (const l of raw.split(/\r?\n/)) {
    let s = l.replace(/\s+$/, '')
    if (/^#\s/.test(s)) continue
    if (/^---+\s*$/.test(s)) continue
    if (/^>\s?/.test(s)) s = s.replace(/^>\s?/, '')
    body.push(s)
  }
  while (body.length && !body[0].trim()) body.shift()
  while (body.length && !body[body.length - 1].trim()) body.pop()
  return body.join(EOL)
}

let all = ''
const csv = ['新章号,原编号与标题,章名,汉字数,源文件']
for (const r of rows) {
  const raw = readFileSync(r.file, 'utf8')
  const text = clean(raw)
  const han = (raw.match(/[\u4e00-\u9fff]/g) || []).length
  const heading = '第' + r.n + '章 ' + r.title
  const name = '第' + String(r.n).padStart(3, '0') + '章 ' + r.title + '.txt'
  writeFileSync(join(perCh, name), heading + EOL + EOL + text + EOL, { encoding: 'utf8' })
  all += heading + EOL + EOL + text + EOL + EOL + EOL
  csv.push([r.n, '第' + r.base + r.suffix, r.title, han, r.file.slice(repo.length + 1)].join(','))
}

writeFileSync(join(out, '答案_全本_121章.txt'), all.trimEnd() + EOL, { encoding: 'utf8' })
writeFileSync(join(out, '章节清单.csv'), '\ufeff' + csv.join(EOL) + EOL, { encoding: 'utf8' })
writeFileSync(
  join(out, '说明.md'),
  [
    '# 投稿版说明',
    '',
    '- 全部纯文本，没有 markdown 标记：原来的 `#` 章标题行与 `>` 引用块（信件、视角小注）只去掉了符号，文字都留着。',
    '- 分章文件在 `分章/`，一个文件一章，第一行是标题，形如「第66章 笑场」。',
    '- 整本在 `答案_全本_121章.txt`。',
    '- 编号是连续重排的：原来的第66章上、第66章下变成第66章、第67章，后面各章依次顺延，所以一共 121 章。',
    '- 想保持 120 章，就把第66、67两章并成一章再投，正文本身不用改。',
    '- `章节清单.csv` 有新旧编号对照和每章汉字数（不含标点）。',
    '',
    '重新生成：在 `网站` 目录跑 `npm run txt`。',
    ''
  ].join(EOL),
  { encoding: 'utf8' }
)

console.log('已导出 ' + rows.length + ' 章到 投稿版/')
