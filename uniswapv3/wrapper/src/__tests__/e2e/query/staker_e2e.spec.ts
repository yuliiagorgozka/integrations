import { ClientConfig, Web3ApiClient } from "@web3api/client-js";
import { buildAndDeployApi, initTestEnvironment, stopTestEnvironment } from "@web3api/test-env-js";
import { getFakeTestToken, getPlugins } from "../testUtils";
import path from "path";
import { ChainIdEnum, Ethereum_TxResponse, FeeAmountEnum, IncentiveKey, Pool, Token } from "../types";
import { createPool, encodeSqrtRatioX96, collectRewards, withdrawToken, encodeDeposit, safeTransferFromParameters } from "../wrappedQueries";
import { ethers, providers } from "ethers";

jest.setTimeout(120000);

describe('Staker', () => {

  const recipient = '0x0000000000000000000000000000000000000003';
  const sender = '0x0000000000000000000000000000000000000004';
  const tokenId = "1";
  const reward: Token = {
    chainId: ChainIdEnum.MAINNET,
    address:'0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    currency: {
      decimals: 18,
      symbol: 'r',
      name: 'reward',
    },
  };

  let token0: Token;
  let token1: Token;
  let pool_0_1: Pool;
  let ethersProvider: providers.JsonRpcProvider;
  let incentiveKey: IncentiveKey;
  let incentiveKeys: IncentiveKey[];

 
  let client: Web3ApiClient;
  let recvier: string
  let ensUri: string;

  beforeAll(async () => {
    const { ethereum: testEnvEtherem, ensAddress, ipfs } = await initTestEnvironment();
    // get client
    const config: ClientConfig = getPlugins(testEnvEtherem, ipfs, ensAddress);
    client = new Web3ApiClient(config);
    // deploy api
    const apiPath: string = path.resolve(__dirname + "/../../../../");
    const api = await buildAndDeployApi(apiPath, ipfs, ensAddress);
    ensUri = `ens/testnet/${api.ensDomain}`;
    ethersProvider = ethers.providers.getDefaultProvider("http://localhost:8546") as providers.JsonRpcProvider;
    recvier = await ethersProvider.getSigner().getAddress();
    // set up test case data
    token0 = getFakeTestToken(0);
    token1 = getFakeTestToken(1);

    const TXresp1 = await client.query<{approve: Ethereum_TxResponse}>({
      uri: ensUri,
      query: `
        mutation {
          approve(
            token: $token
          )
        }
      `,
      variables: {
        token: getFakeTestToken(0),
      },
    });
    const T1Approve: string = TXresp1.data?.approve?.hash ?? "";
    const ApproveTx1= await ethersProvider.getTransaction(T1Approve);
    await ApproveTx1.wait();

  
    const TXresp2 = await client.query<{approve: Ethereum_TxResponse}>({
      uri: ensUri,
      query: `
        mutation {
          approve(
            token: $token
          )
        }
      `,
      variables: {
        token: getFakeTestToken(1),
      },
    });
    const T2Approve: string = TXresp2.data?.approve?.hash ?? "";
    const ApproveTx2 = await ethersProvider.getTransaction(T2Approve);
    await ApproveTx2.wait();
    pool_0_1 = await createPool(client, ensUri, token0, token1, FeeAmountEnum.MEDIUM, await encodeSqrtRatioX96(client, ensUri, 1, 1), 0, 0, []);
    incentiveKey = {
      rewardToken: reward,
      pool: pool_0_1,
      startTime: "100",
      endTime: "200",
      refundee: '0x0000000000000000000000000000000000000001'
    };
    incentiveKeys = [incentiveKey];
    incentiveKeys.push({
      rewardToken: reward,
      pool: pool_0_1,
      startTime: "50",
      endTime: "100",
      refundee: '0x0000000000000000000000000000000000000089'
    });
  });



  afterAll(async () => {
    await stopTestEnvironment();
  });

  describe('collectRewards', () => {
    it('succeeds with amount', async () => {
      const { calldata, value } = await collectRewards(client, ensUri, [incentiveKey], {
        tokenId: tokenId,
        recipient: recipient,
        amount: "1"
      })

      expect(calldata).toEqual(
        '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f2d2909b0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000'
      )
      expect(value).toEqual('0x00')
    })

    it('succeeds no amount', async () => {
      const { calldata, value } = await collectRewards(client, ensUri, [incentiveKey], {
        tokenId: tokenId,
        recipient: recipient,
      })

      expect(calldata).toEqual(
        '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f2d2909b0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000'
      )
      expect(value).toEqual('0x00')
    })

    it('succeeds multiple keys', async () => {
      const { calldata, value } = await collectRewards(client, ensUri, incentiveKeys, {
        tokenId: tokenId,
        recipient: recipient,
      })

      expect(calldata).toEqual(
        '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000460000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f2d2909b0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd200000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f2d2909b0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000089000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000'
      )
      expect(value).toEqual('0x00')
    })
  })

  describe('withdrawToken', () => {
    it('succeeds with one keys', async () => {
      const { calldata, value } = await withdrawToken(client, ensUri, [incentiveKey], {
        tokenId: tokenId,
        recipient: recipient,
        amount: "0",
        owner: sender,
        data: '0x0000000000000000000000000000000000000008'
      })

      expect(calldata).toEqual(
        '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a43c423f0b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
      expect(value).toEqual('0x00')
    })

    it('succeeds with multiple keys', async () => {
      const { calldata, value } = await withdrawToken(client, ensUri, incentiveKeys, {
        tokenId: tokenId,
        recipient: recipient,
        amount: "0",
        owner: sender,
        data: '0x0000000000000000000000000000000000000008'
      })

      expect(calldata).toEqual(
        '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000034000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4f549ab420000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd200000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000008900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000642f2d783d0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a43c423f0b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
      expect(value).toEqual('0x00')
    })
  })

  describe('encodeDeposit', () => {
    it('succeeds single key', async () => {
      const deposit: string = await encodeDeposit(client, ensUri, [incentiveKey]);

      expect(deposit).toEqual(
        '0x0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000001'
      )
    })

    it('succeeds multiple keys', async () => {
      const deposit: string = await encodeDeposit(client, ensUri, incentiveKeys);

      expect(deposit).toEqual(
        '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c800000000000000000000000000000000000000000000000000000000000000010000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000089'
      )
    })
  })

  describe('safeTransferFrom with correct data for staker', () => {
    it('succeeds', async () => {
      const data = await encodeDeposit(client, ensUri, [incentiveKey]);

      const options = {
        sender,
        recipient,
        tokenId,
        data
      }
      const { calldata, value } = await safeTransferFromParameters(client, ensUri, options);

      expect(calldata).toEqual(
        '0xb88d4fde000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f9840000000000000000000000004fa63b0dea87d2cd519f3b67a5ddb145779b7bd2000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000001'
      )
      expect(value).toEqual('0x00')
    })
  })
})