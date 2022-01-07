// NOTE: This is generated by 'w3 codegen', DO NOT MODIFY

// @ts-noCheck
import {
  UInt,
  UInt8,
  UInt16,
  UInt32,
  Int,
  Int8,
  Int16,
  Int32,
  Bytes,
  BigInt,
  Json,
  String,
  Boolean
} from "../baseTypes";

export interface TxReceipt {
  to: String;
  from: String;
  contractAddress: String;
  transactionIndex: UInt32;
  root?: String | null;
  gasUsed: BigInt;
  logsBloom: String;
  transactionHash: String;
  logs: Array<Log>;
  blockNumber: BigInt;
  blockHash: String;
  confirmations: UInt32;
  cumulativeGasUsed: BigInt;
  effectiveGasPrice: BigInt;
  byzantium: Boolean;
  type: UInt32;
  status?: UInt32 | null;
}

export interface TxResponse {
  hash: String;
  to?: String | null;
  from: String;
  nonce: UInt32;
  gasLimit: BigInt;
  gasPrice?: BigInt | null;
  data: String;
  value: BigInt;
  chainId: UInt32;
  blockNumber?: BigInt | null;
  blockHash?: String | null;
  timestamp?: UInt32 | null;
  confirmations: UInt32;
  raw?: String | null;
  r?: String | null;
  s?: String | null;
  v?: UInt32 | null;
  type?: UInt32 | null;
  accessList?: Array<Access> | null;
}

export interface TxRequest {
  to?: String | null;
  from?: String | null;
  nonce?: UInt32 | null;
  gasLimit?: BigInt | null;
  gasPrice?: BigInt | null;
  data?: String | null;
  value?: BigInt | null;
  chainId?: UInt32 | null;
  type?: UInt32 | null;
}

export interface TxOverrides {
  gasLimit?: BigInt | null;
  gasPrice?: BigInt | null;
  value?: BigInt | null;
}

export interface StaticTxResult {
  result: String;
  error: Boolean;
}

export interface Log {
  blockNumber: BigInt;
  blockHash: String;
  transactionIndex: UInt32;
  removed: Boolean;
  address: String;
  data: String;
  topics: Array<String>;
  transactionHash: String;
  logIndex: UInt32;
}

export interface EventNotification {
  data: String;
  address: String;
  log: Log;
}

export interface Access {
  address: String;
  storageKeys: Array<String>;
}

export interface Connection {
  node?: String | null;
  networkNameOrChainId?: String | null;
}

export interface Network {
  name: String;
  chainId: Int;
  ensAddress?: String | null;
}

/// Imported Objects START ///

/// Imported Objects END ///