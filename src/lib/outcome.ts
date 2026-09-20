type Score = {
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};
export function teamOutcome(result: Score | undefined, teamId: string | undefined) {
  if (
    !result ||
    result.status !== 'final' ||
    !teamId ||
    ![result.homeTeamId, result.awayTeamId].includes(teamId)
  )
    return null;
  const difference = (result.homeScore - result.awayScore) * (teamId === result.homeTeamId ? 1 : -1);
  return difference > 0 ? 'Win' : difference < 0 ? 'Loss' : 'Tie';
}
