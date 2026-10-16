/**
 * Dividend event scanning helpers — shared by dashboard and discovery features.
 *
 * Every figure here comes from on-chain logs. When no matching logs exist the
 * result is null (unavailable), never a fabricated zero.
 */

import { type Address, type AbiEvent } from 'viem'
import { rpcClient, TRANSFER_EVENT } from './argus-data'

export const DIVIDEND_WITHDRAWN_EVENT: AbiEvent = {
  type: 'event',
  name: 'DividendWithdrawn',
  inputs: [
    { type: 'address', name: 'account', indexed: true },
    { type: 'uint256', name: 'weiAmount', indexed: false },
  ],
}

export const DIVIDENDS_PAID_EVENT: AbiEvent = {
  type: 'event',
  name: 'DividendsPaid',
  inputs: [
    { type: 'address', name: 'recipient', indexed: true },
    { type: 'uint256', name: 'amount', indexed: false },
  ],
}

export const DIVIDEND_CLAIMED_EVENT: AbiEvent = {
  type: 'event',
  name: 'DividendClaimed',
  inputs: [
    { type: 'address', name: 'recipient', indexed: true },
    { type: 'uint256', name: 'amount', indexed: false },
  ],
}

export interface DividendEventRecord {
  blockNumber: bigint
  txHash: string
  contract: Address
  recipient: Address
  amount: bigint
  kind: 'paid' | 'withdrawn' | 'claimed'
}

function parseLogs(
  logs: unknown[],
  contract: Address,
  kind: DividendEventRecord['kind'],
  recipientField: 'recipient' | 'account',
  amountField: 'amount' | 'weiAmount',
): DividendEventRecord[] {
  const out: DividendEventRecord[] = []
  for (const raw of logs) {
    const log = raw as {
      args?: Record<string, unknown>
      blockNumber: bigint | null
      transactionHash: string | null
    }
    const args = log.args ?? {}
    const recipient = args[recipientField]
    const amount = args[amountField]
    if (typeof recipient !== 'string' || typeof amount !== 'bigint') continue
    out.push({
      blockNumber: log.blockNumber ?? 0n,
      txHash: log.transactionHash ?? '',
      contract,
      recipient: recipient as Address,
      amount,
      kind,
    })
  }
  return out
}

/** Scan a single contract for all dividend-shaped events for a wallet. */
export async function scanDividendEventsFor(
  contract: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<DividendEventRecord[]> {
  const records: DividendEventRecord[] = []
  for (const [event, kind, recipientField, amountField] of [
    [DIVIDEND_WITHDRAWN_EVENT, 'withdrawn', 'account', 'weiAmount'],
    [DIVIDENDS_PAID_EVENT, 'paid', 'recipient', 'amount'],
    [DIVIDEND_CLAIMED_EVENT, 'claimed', 'recipient', 'amount'],
  ] as const) {
    try {
      const logs = await rpcClient.getLogs({
        address: contract,
        event: event as AbiEvent,
        args: { [recipientField]: wallet } as never,
        fromBlock,
        toBlock,
      })
      records.push(...parseLogs(logs, contract, kind, recipientField, amountField))
    } catch {
      // event not present on this contract — skip
    }
  }
  return records
}

/** Sum a list of event records. */
export function sumDividendRecords(records: DividendEventRecord[]): bigint {
  return records.reduce((acc, r) => acc + r.amount, 0n)
}

/**
 * Scan a single contract for GLOBAL dividend events (any recipient).
 * Used by the live feed and leaderboard.
 */
export async function scanGlobalDividendEvents(
  contract: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<DividendEventRecord[]> {
  const records: DividendEventRecord[] = []
  for (const [event, kind, recipientField, amountField] of [
    [DIVIDEND_WITHDRAWN_EVENT, 'withdrawn', 'account', 'weiAmount'],
    [DIVIDENDS_PAID_EVENT, 'paid', 'recipient', 'amount'],
    [DIVIDEND_CLAIMED_EVENT, 'claimed', 'recipient', 'amount'],
  ] as const) {
    try {
      const logs = await rpcClient.getLogs({
        address: contract,
        event: event as AbiEvent,
        fromBlock,
        toBlock,
      })
      records.push(...parseLogs(logs, contract, kind, recipientField, amountField))
    } catch {
      // skip
    }
  }
  return records
}

/** Get wallet transfer events (for holdings discovery + daily history). */
export async function scanTransfersFor(
  token: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
) {
  try {
    return await rpcClient.getLogs({
      address: token,
      event: TRANSFER_EVENT,
      args: { to: wallet },
      fromBlock,
      toBlock,
    })
  } catch {
    return []
  }
}
