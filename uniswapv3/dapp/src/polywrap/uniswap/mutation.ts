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
import {
  SwapArgs,
  Currency,
  Token,
  Route,
  Tick,
  TickListDataProvider,
  Pool,
  Trade,
  TokenAmount,
  TradeSwap,
  Price,
  SwapOptions,
  PermitOptions,
  FeeOptions,
  MethodParameters,
  GasOptions,
  NextTickResult,
  PoolChangeResult,
  TradeRoute,
  IncentiveKey,
  ClaimOptions,
  FullWithdrawOptions,
  QuoteOptions,
  CommonAddLiquidityOptions,
  AddLiquidityOptions,
  SafeTransferOptions,
  CollectOptions,
  NFTPermitOptions,
  RemoveLiquidityOptions,
  BestTradeOptions,
  Position,
  MintAmounts,
  ChainIdEnum,
  ChainIdString,
  ChainId,
  FeeAmountEnum,
  FeeAmountString,
  FeeAmount,
  TradeTypeEnum,
  TradeTypeString,
  TradeType,
  PermitVEnum,
  PermitVString,
  PermitV,
  RoundingEnum,
  RoundingString,
  Rounding,
  Ethereum_Connection,
  Ethereum_TxOverrides,
  Ethereum_TxResponse,
  Ethereum_Access,
  Ethereum_TxReceipt,
  Ethereum_Log,
  Ethereum_TxRequest,
  Ethereum_StaticTxResult,
  Ethereum_EventNotification,
  Ethereum_Network,
  ERC20_Ethereum_Connection,
  Ethereum_Mutation,
  Ethereum_Query,
  SHA3_Query,
  EthersSolidity_Query,
  ERC20_Query,
  Subgraph_Query,
} from "./types";
import { ExtensionInvocation } from "@web3api/core-js";

export interface Input_placeholder extends Record<string, unknown> {
  param: Boolean;
}

export interface UniswapMutationModule {
  placeholder(input: Input_placeholder): ExtensionInvocation<Boolean>;
}
