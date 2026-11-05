export function serviceMatchesSport(
  role: 'COACH' | 'BALLBOY',
  type: string | null | undefined,
  sport: 'PADEL' | 'TENNIS'
) {
  const effective = type ?? (role === 'BALLBOY' ? 'TENNIS' : undefined);
  return effective === sport || effective === 'PADEL_TENNIS';
}
