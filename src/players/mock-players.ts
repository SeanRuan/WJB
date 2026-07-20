export type MockPlayer = {
  id: string;
  externalId: string;
  nickname: string;
  status: string;
  coinBalance: bigint;
  createdAt: Date;
  updatedAt: Date;
  roomCardBalance: { balance: number } | null;
};

export const MOCK_PLAYERS: MockPlayer[] = [
  {
    id: 'mock_player_001',
    externalId: 'wuji-test-1001',
    nickname: '青龍',
    status: 'active',
    coinBalance: BigInt(158000),
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-16T04:12:00.000Z'),
    roomCardBalance: { balance: 220 },
  },
  {
    id: 'mock_player_002',
    externalId: 'wuji-test-1002',
    nickname: '白虎',
    status: 'active',
    coinBalance: BigInt(90420),
    createdAt: new Date('2026-07-02T03:11:00.000Z'),
    updatedAt: new Date('2026-07-15T15:01:00.000Z'),
    roomCardBalance: { balance: 55 },
  },
  {
    id: 'mock_player_003',
    externalId: 'wuji-test-1003',
    nickname: '玄武',
    status: 'banned',
    coinBalance: BigInt(30210),
    createdAt: new Date('2026-07-03T08:09:00.000Z'),
    updatedAt: new Date('2026-07-14T22:26:00.000Z'),
    roomCardBalance: { balance: 0 },
  },
];

export function listMockPlayers() {
  return MOCK_PLAYERS.slice();
}

export function findMockPlayerById(id: string) {
  return MOCK_PLAYERS.find((player) => player.id === id) ?? null;
}

export function updateMockPlayerStatus(id: string, status: string) {
  const player = findMockPlayerById(id);

  if (!player) {
    return null;
  }

  player.status = status;
  player.updatedAt = new Date();

  return player;
}
