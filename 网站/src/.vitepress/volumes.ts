// 分卷定义：改这里即可调整卷名与边界，正文不用动
export interface Volume {
  name: string
  from: number
  to: number
}

export const volumes: Volume[] = [
  { name: '第一卷 · 蝉鸣', from: 1, to: 12 },
  { name: '第二卷 · 回潮', from: 13, to: 42 },
  { name: '第三卷 · 潮汐', from: 43, to: 72 },
  { name: '第四卷 · 退潮', from: 73, to: 97 },
  { name: '第五卷 · 答案', from: 98, to: 120 }
]

export function volumeOf(chapterNo: number): Volume | undefined {
  return volumes.find((v) => chapterNo >= v.from && chapterNo <= v.to)
}
