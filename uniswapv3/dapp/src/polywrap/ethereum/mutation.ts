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
  TxReceipt,
  TxResponse,
  TxRequest,
  TxOverrides,
  StaticTxResult,
  Log,
  EventNotification,
  Access,
  Connection,
  Network,
} from "./types";
import { ExtensionInvocation } from "@web3api/core-js";

export interface Input_callContractMethod extends Record<string, unknown> {
  address: String;
  method: String;
  args?: Array<String> | null;
  connection?: Connection | null;
  txOverrides?: TxOverrides | null;
}

export interface Input_callContractMethodAndWait extends Record<string, unknown> {
  address: String;
  method: String;
  args?: Array<String> | null;
  connection?: Connection | null;
  txOverrides?: TxOverrides | null;
}

export interface Input_sendTransaction extends Record<string, unknown> {
  tx: TxRequest;
  connection?: Connection | null;
}

export interface Input_sendTransactionAndWait extends Record<string, unknown> {
  tx: TxRequest;
  connection?: Connection | null;
}

export interface Input_deployContract extends Record<string, unknown> {
  abi: String;
  bytecode: String;
  args?: Array<String> | null;
  connection?: Connection | null;
}

export interface Input_signMessage extends Record<string, unknown> {
  message: String;
  connection?: Connection | null;
}

export interface Input_sendRPC extends Record<string, unknown> {
  method: String;
  params: Array<String>;
  connection?: Connection | null;
}

export interface EthereumMutationModule {
  callContractMethod(input: Input_callContractMethod): ExtensionInvocation<TxResponse>;
  callContractMethodAndWait(input: Input_callContractMethodAndWait): ExtensionInvocation<TxReceipt>;
  sendTransaction(input: Input_sendTransaction): ExtensionInvocation<TxResponse>;
  sendTransactionAndWait(input: Input_sendTransactionAndWait): ExtensionInvocation<TxReceipt>;
  deployContract(input: Input_deployContract): ExtensionInvocation<String>;
  signMessage(input: Input_signMessage): ExtensionInvocation<String>;
  sendRPC(input: Input_sendRPC): ExtensionInvocation<String | null>;
}
