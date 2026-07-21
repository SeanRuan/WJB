import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

export type MockPlayer = {
  id: string;
  externalId: string;
  nickname: string;
  status: string;
  note: string | null;
  tags: string | null;
  coinBalance: bigint;
  createdAt: Date;
  updatedAt: Date;
  roomCardBalance: { balance: number } | null;
};

type PersistedMockPlayer = {
  id: string;
  externalId: string;
  nickname: string;
  status: string;
  note?: string | null;
  tags?: string | null;
  coinBalance: string;
  createdAt: string;
  updatedAt: string;
  roomCardBalance: { balance: number } | null;
};

type PersistedMockExternalIdReservations = {
  externalIds: string[];
};

const MONTHLY_PLAYER_TEMPLATES = [
  {
    nickname: '青龍',
    status: 'active',
    roomCardBalance: 220,
    coinBalance: BigInt(158000),
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T12:18:00.000Z'),
  },
  {
    nickname: '白虎',
    status: 'active',
    roomCardBalance: 55,
    coinBalance: BigInt(90420),
    createdAt: new Date('2026-07-19T03:11:00.000Z'),
    updatedAt: new Date('2026-07-19T15:01:00.000Z'),
  },
  {
    nickname: '玄武',
    status: 'banned',
    roomCardBalance: 0,
    coinBalance: BigInt(30210),
    createdAt: new Date('2026-07-18T08:09:00.000Z'),
    updatedAt: new Date('2026-07-18T22:26:00.000Z'),
  },
] as const;

const MOCK_STATE_DIR = path.join(process.cwd(), '.cache', 'mock-state');
const MOCK_PLAYERS_PATH = path.join(MOCK_STATE_DIR, 'players.json');
const MOCK_EXTERNAL_ID_RESERVATIONS_PATH = path.join(
  MOCK_STATE_DIR,
  'external-id-reservations.json',
);

export const MOCK_PLAYERS: MockPlayer[] = loadMockPlayers();
const MOCK_RESERVED_EXTERNAL_IDS = loadMockExternalIdReservations(MOCK_PLAYERS);

function buildMockPlayers() {
  const players: MockPlayer[] = [
    ...MONTHLY_PLAYER_TEMPLATES.map((template, index) => ({
      id: `mock_player_00${index + 1}`,
      externalId: `wuji-test-100${index + 1}`,
      nickname: template.nickname,
      status: template.status,
      note: null,
      tags: null,
      coinBalance: template.coinBalance,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      roomCardBalance: { balance: template.roomCardBalance },
    })),
  ];

  const months = [
    { year: 2026, month: 5, label: '2026-06' },
    { year: 2026, month: 4, label: '2026-05' },
    { year: 2026, month: 3, label: '2026-04' },
    { year: 2026, month: 2, label: '2026-03' },
    { year: 2026, month: 1, label: '2026-02' },
    { year: 2026, month: 0, label: '2026-01' },
    { year: 2025, month: 11, label: '2025-12' },
    { year: 2025, month: 10, label: '2025-11' },
    { year: 2025, month: 9, label: '2025-10' },
    { year: 2025, month: 8, label: '2025-09' },
    { year: 2025, month: 7, label: '2025-08' },
  ];

  const slotTemplates = [
    {
      suffix: '青龍',
      status: 'active',
      coinOffset: 0,
      roomCardOffset: 0,
      createdDay: 5,
      updatedDay: 6,
    },
    {
      suffix: '白虎',
      status: 'active',
      coinOffset: 4200,
      roomCardOffset: 35,
      createdDay: 15,
      updatedDay: 16,
    },
    {
      suffix: '玄武',
      status: 'banned',
      coinOffset: 8600,
      roomCardOffset: 70,
      createdDay: 25,
      updatedDay: 26,
    },
  ] as const;

  let sequence = 4;

  months.forEach((month, monthIndex) => {
    slotTemplates.forEach((slot, slotIndex) => {
      const sequenceSuffix = String(sequence).padStart(3, '0');
      const externalMonth = `${month.year}${String(month.month + 1).padStart(2, '0')}`;
      const createdAt = new Date(
        Date.UTC(
          month.year,
          month.month,
          slot.createdDay,
          10 + slotIndex * 2,
          8 + slotIndex * 9,
          0,
        ),
      );
      const updatedAt = new Date(
        Date.UTC(
          month.year,
          month.month,
          slot.updatedDay,
          12 + slotIndex * 2,
          14 + slotIndex * 7,
          0,
        ),
      );

      players.push({
        id: `mock_player_${sequenceSuffix}`,
        externalId: `wuji-test-${externalMonth}-${String(slotIndex + 1).padStart(2, '0')}`,
        nickname: `${month.label} ${slot.suffix}`,
        status: slot.status,
        note: null,
        tags: null,
        coinBalance: BigInt(152000 - monthIndex * 4200 - slot.coinOffset),
        createdAt,
        updatedAt,
        roomCardBalance: { balance: Math.max(0, 180 - monthIndex * 12 - slot.roomCardOffset) },
      });

      sequence += 1;
    });
  });

  return players;
}

function loadMockPlayers(): MockPlayer[] {
  const persistedPlayers = readPersistedMockPlayers();

  if (persistedPlayers) {
    return persistedPlayers;
  }

  const seededPlayers = buildMockPlayers();
  saveMockPlayers(seededPlayers);
  return seededPlayers;
}

function readPersistedMockPlayers() {
  if (!existsSync(MOCK_PLAYERS_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(MOCK_PLAYERS_PATH, 'utf8');
    const parsed = JSON.parse(content) as PersistedMockPlayer[];

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map(deserializeMockPlayer);
  } catch {
    return null;
  }
}

function saveMockPlayers(players: MockPlayer[]) {
  ensureMockStateDir();
  const payload = players.map(serializeMockPlayer);
  writeFileSync(MOCK_PLAYERS_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function loadMockExternalIdReservations(players: MockPlayer[]) {
  const seeded = new Set(players.map((player) => player.externalId));

  if (!existsSync(MOCK_EXTERNAL_ID_RESERVATIONS_PATH)) {
    saveMockExternalIdReservations(seeded);
    return seeded;
  }

  try {
    const content = readFileSync(MOCK_EXTERNAL_ID_RESERVATIONS_PATH, 'utf8');
    const parsed = JSON.parse(content) as PersistedMockExternalIdReservations;
    const ids = Array.isArray(parsed?.externalIds) ? parsed.externalIds : [];
    ids.forEach((id) => {
      if (typeof id === 'string' && id.trim()) {
        seeded.add(id.trim());
      }
    });
    saveMockExternalIdReservations(seeded);
    return seeded;
  } catch {
    saveMockExternalIdReservations(seeded);
    return seeded;
  }
}

function saveMockExternalIdReservations(externalIds: Set<string>) {
  ensureMockStateDir();
  const payload: PersistedMockExternalIdReservations = {
    externalIds: Array.from(externalIds).sort(),
  };
  writeFileSync(
    MOCK_EXTERNAL_ID_RESERVATIONS_PATH,
    JSON.stringify(payload, null, 2),
    'utf8',
  );
}

function ensureMockStateDir() {
  mkdirSync(MOCK_STATE_DIR, { recursive: true });
}

function serializeMockPlayer(player: MockPlayer): PersistedMockPlayer {
  return {
    ...player,
    coinBalance: player.coinBalance.toString(),
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  };
}

function deserializeMockPlayer(player: PersistedMockPlayer): MockPlayer {
  return {
    ...player,
    coinBalance: BigInt(player.coinBalance),
    createdAt: new Date(player.createdAt),
    updatedAt: new Date(player.updatedAt),
    note: player.note ?? null,
    tags: player.tags ?? null,
    roomCardBalance: player.roomCardBalance,
  };
}

export function listMockPlayers() {
  return MOCK_PLAYERS.slice();
}

export function findMockPlayerById(id: string) {
  return MOCK_PLAYERS.find((player) => player.id === id) ?? null;
}

export function createMockPlayer(input: {
  externalId: string;
  nickname: string;
  status: string;
  note?: string | null;
  tags?: string | null;
}) {
  const nextSequence = String(MOCK_PLAYERS.length + 1).padStart(3, '0');
  const now = new Date();
  const player = {
    id: `mock_player_${nextSequence}`,
    externalId: input.externalId,
    nickname: input.nickname,
    status: input.status,
    note: input.note ?? null,
    tags: input.tags ?? null,
    coinBalance: BigInt(0),
    createdAt: now,
    updatedAt: now,
    roomCardBalance: { balance: 0 },
  } satisfies MockPlayer;

  MOCK_PLAYERS.unshift(player);
  reserveMockExternalId(input.externalId);
  saveMockPlayers(MOCK_PLAYERS);

  return player;
}

export function updateMockPlayer(
  id: string,
  input: {
    externalId?: string;
    nickname?: string;
    status?: string;
    note?: string | null;
    tags?: string | null;
  },
) {
  const player = findMockPlayerById(id);

  if (!player) {
    return null;
  }

  if (input.externalId) {
    player.externalId = input.externalId;
    reserveMockExternalId(input.externalId);
  }

  if (input.nickname) {
    player.nickname = input.nickname;
  }

  if (input.status) {
    player.status = input.status;
  }

  if (input.note !== undefined) {
    player.note = input.note;
  }

  if (input.tags !== undefined) {
    player.tags = input.tags;
  }

  player.updatedAt = new Date();
  saveMockPlayers(MOCK_PLAYERS);

  return player;
}

export function updateMockPlayerRoomCardBalance(id: string, balance: number) {
  const player = findMockPlayerById(id);

  if (!player) {
    return null;
  }

  player.roomCardBalance = { balance };
  player.updatedAt = new Date();
  saveMockPlayers(MOCK_PLAYERS);

  return player;
}

export function updateMockPlayerStatus(id: string, status: string) {
  const player = findMockPlayerById(id);

  if (!player) {
    return null;
  }

  player.status = status;
  player.updatedAt = new Date();
  saveMockPlayers(MOCK_PLAYERS);

  return player;
}

export function listMockReservedExternalIds() {
  return Array.from(MOCK_RESERVED_EXTERNAL_IDS);
}

export function reserveMockExternalId(externalId: string) {
  const normalized = externalId.trim();
  if (!normalized) {
    return;
  }

  MOCK_RESERVED_EXTERNAL_IDS.add(normalized);
  saveMockExternalIdReservations(MOCK_RESERVED_EXTERNAL_IDS);
}
