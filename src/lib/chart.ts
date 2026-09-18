import type { RatingsSnapshot } from './schema';
import { weeklyChange } from './history';
export const chartColors = ['#aa1728','#17657c','#704e98','#8d651f','#31733d','#b44722','#2751a0','#a23578','#485f22','#624b38','#266f68','#5c637c','#804157'];
export function chartModel(releases: RatingsSnapshot[], selected: string[]) {
  const values = releases.flatMap(release => release.rows.filter(row => selected.includes(row.teamId) && row.rating !== null).map(row => row.rating!));
  if (!values.length) return null;
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const start = Date.parse(releases[0].releaseDate);
  const end = Date.parse(releases.at(-1)!.releaseDate);
  const x = (date: string) => end === start ? 450 : 64 + (Date.parse(date)-start) / (end-start) * 780;
  const y = (value: number) => 250 - (value-min)/(max-min)*205;
  const series = selected.map(teamId => {
    const segments: { date:string; value:number; x:number; y:number; delta:number|null; rank:number|null; category:string }[][] = [];
    let segment: typeof segments[number] = [];
    releases.forEach((release,index) => {
      const row = release.rows.find(row => row.teamId === teamId);
      const prior = index ? releases[index-1] : null;
      if (row?.rating == null || (prior && (Date.parse(release.releaseDate)-Date.parse(prior.releaseDate) !== 7*86400000 || prior.category !== release.category))) {
        if (segment.length) segments.push(segment);
        segment = [];
      }
      if (row?.rating != null) segment.push({date:release.releaseDate,value:row.rating,x:x(release.releaseDate),y:y(row.rating),delta:weeklyChange(releases,teamId,index),rank:row.rank,category:release.category});
    });
    if(segment.length) segments.push(segment);
    return { teamId,segments };
  });
  return { min,max,start,end,series,x,y };
}
