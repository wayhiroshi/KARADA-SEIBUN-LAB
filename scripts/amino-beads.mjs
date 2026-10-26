export function renderAminoBeads() {
  const rows = [
    ['まずは、この並び', 'ABCABC'],
    ['種類も数も同じ。順番を変えると', 'ACBACB'],
    ['数を増やすと、長い鎖に', 'ABCABCABC']
  ];
  return `<figure class="amino-beads" aria-label="三種類のビーズで比べる、順番と長さの違い">
    ${rows.map(([label, sequence]) => `<div class="amino-beads-row"><p>${label}</p><div class="amino-beads-chain" aria-label="${sequence.split('').join('・')}">${[...sequence].map(c => `<span class="amino-bead amino-bead-${c.toLowerCase()}" aria-hidden="true">${c}</span>`).join('')}</div></div>`).join('')}
    <figcaption>アミノ酸の種類を色とA・B・Cで表した、短い鎖のたとえです。</figcaption>
  </figure>`;
}
