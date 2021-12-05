import {
  ChainId,
  FeeAmount,
  Pool,
  Price as PriceType,
  Token,
  TokenAmount,
  Trade,
  TradeSwap,
  TradeType
} from "../../../query/w3";
import { ETHER, getWETH } from "../../../utils/tokenUtils";
import {
  bestTradeExactIn,
  bestTradeExactOut,
  createPool,
  createRoute,
  createTradeFromRoute,
  createTradeFromRoutes,
  createUncheckedTrade,
  createUncheckedTradeWithMultipleRoutes,
  encodeSqrtRatioX96,
  getTickAtSqrtRatio,
  nearestUsableTick,
  tradeMaximumAmountIn,
  tradeMinimumAmountOut,
  tradeWorstExecutionPrice
} from "../../../query";
import { BigInt, Nullable } from "@web3api/wasm-as";
import { getTickSpacings } from "../../../utils/utils";
import { MAX_TICK, MIN_TICK } from "../../../utils/constants";
import Price from "../../../utils/Price";


const getTestToken = (i: i32): Token => {
  return {
    chainId: ChainId.MAINNET,
    address: "0x000000000000000000000000000000000000000" + (i + 1).toString(),
    currency: {
      decimals: 18,
      symbol: "t" + i.toString(),
      name: "token" + i.toString(),
    }
  };
};

const v2StylePool = (
  reserve0: TokenAmount,
  reserve1: TokenAmount,
  feeAmount: FeeAmount = FeeAmount.MEDIUM
): Pool =>  {
  const sqrtRatioX96: BigInt = encodeSqrtRatioX96({ amount1: reserve1.amount, amount0: reserve0.amount });
  const liquidity: BigInt = BigInt.mul(reserve0.amount, reserve1.amount).sqrt();
  return createPool({
    tokenA: reserve0.token,
    tokenB: reserve1.token,
    fee: feeAmount,
    sqrtRatioX96: sqrtRatioX96,
    liquidity: liquidity,
    tickCurrent: getTickAtSqrtRatio({ sqrtRatioX96 }),
    ticks: { ticks: [
      {
        index: nearestUsableTick({ tick: MIN_TICK, tickSpacing: getTickSpacings(feeAmount) }),
        liquidityNet: liquidity,
        liquidityGross: liquidity
      },
      {
        index: nearestUsableTick({ tick: MAX_TICK, tickSpacing: getTickSpacings(feeAmount) }),
        liquidityNet: liquidity.opposite(),
        liquidityGross: liquidity
      }
    ]}
  });
};

const eth: Token = {
  chainId: ChainId.MAINNET,
  address: "",
  currency: ETHER,
};
const token0 = getTestToken(0);
const token1 = getTestToken(1);
const token2 = getTestToken(2);
const token3 = getTestToken(3);

const pool_0_1: Pool = v2StylePool(
  { token: token0, amount: BigInt.fromUInt32(100000) },
  { token: token1, amount: BigInt.fromUInt32(100000) }
);
const pool_0_2: Pool = v2StylePool(
  { token: token0, amount: BigInt.fromUInt32(100000) },
  { token: token2, amount: BigInt.fromUInt32(110000) }
);
const pool_0_3: Pool = v2StylePool(
  { token: token0, amount: BigInt.fromUInt32(100000) },
  { token: token3, amount: BigInt.fromUInt32(90000) }
);
const pool_1_2: Pool = v2StylePool(
  { token: token1, amount: BigInt.fromUInt32(120000) },
  { token: token2, amount: BigInt.fromUInt32(100000) }
);
const pool_1_3: Pool = v2StylePool(
  { token: token1, amount: BigInt.fromUInt32(120000) },
  { token: token3, amount: BigInt.fromUInt32(130000) }
);
const pool_weth_0: Pool = v2StylePool(
  { token: getWETH(ChainId.MAINNET), amount: BigInt.fromUInt32(100000) },
  { token: token0, amount: BigInt.fromUInt32(100000) }
);
const pool_weth_1: Pool = v2StylePool(
  { token: getWETH(ChainId.MAINNET), amount: BigInt.fromUInt32(100000) },
  { token: token1, amount: BigInt.fromUInt32(100000) }
);
const pool_weth_2: Pool = v2StylePool(
  { token: getWETH(ChainId.MAINNET), amount: BigInt.fromUInt32(100000) },
  { token: token2, amount: BigInt.fromUInt32(100000) }
);

const getSwap = (pools: Pool[], inToken: Token, outToken: Token, inputAmount: u16, outputAmount: u16): TradeSwap => {
  return {
    route: createRoute({
      pools,
      inToken,
      outToken,
    }),
    inputAmount: {
      token: inToken,
      amount: BigInt.fromUInt16(inputAmount),
    },
    outputAmount: {
      token: outToken,
      amount: BigInt.fromUInt16(outputAmount),
    },
  };
};

const uncheckedTrade = (inToken: Token, outToken: Token, pools: Pool[], inputAmount: u16, outputAmount: u16, tradeType: TradeType): Trade => {
  const swap: TradeSwap = getSwap(pools, inToken, outToken, inputAmount, outputAmount);
  return createUncheckedTrade({ swap, tradeType });
};

const uncheckedTradeMultiRoute = (inToken: Token, outToken: Token, pools0: Pool[], pools1: Pool[], in0: u16, out0: u16, in1: u16, out1: u16, tradeType: TradeType): Trade => {
  return createUncheckedTradeWithMultipleRoutes({
    swaps: [
      getSwap(pools0, inToken, outToken, in0, out0),
      getSwap(pools1, inToken, outToken, in1, out1)
    ],
    tradeType
  });
};

const tradeFromRoute = (inToken: Token, outToken: Token, pools: Pool[], amount: u16, tradeType: TradeType): Trade => {
  return createTradeFromRoute({
    tradeRoute: {
      route: createRoute({
        pools: pools,
        inToken: inToken,
        outToken: outToken,
      }),
      amount: {
        token: tradeType == TradeType.EXACT_INPUT ? inToken : outToken,
        amount: BigInt.fromUInt16(amount),
      }
    },
    tradeType: tradeType,
  });
};

const exactIn: Trade = uncheckedTrade(token0, token2, [pool_0_1, pool_1_2],100, 69, TradeType.EXACT_INPUT);
const exactInMultiRoute0: Trade = uncheckedTradeMultiRoute(token0, token2, [pool_0_1, pool_1_2], [pool_0_2], 50, 35, 50, 34, TradeType.EXACT_INPUT);
const exactInMultiRoute1: Trade = uncheckedTradeMultiRoute(token0, token2, [pool_0_1, pool_1_2], [pool_0_2], 90, 62, 10, 7, TradeType.EXACT_INPUT);
const exactOut: Trade = uncheckedTrade(token0, token2, [pool_0_1, pool_1_2], 156, 100, TradeType.EXACT_OUTPUT);
const exactOutMultiRoute0: Trade = uncheckedTradeMultiRoute(token0, token2, [pool_0_1, pool_1_2], [pool_0_2], 78, 50, 78, 50, TradeType.EXACT_OUTPUT);
const exactOutMultiRoute1: Trade = uncheckedTradeMultiRoute(token0, token2, [pool_0_1, pool_1_2], [pool_0_2], 140, 90, 16, 10, TradeType.EXACT_OUTPUT);
const exactInFromRoute0: Trade = tradeFromRoute(token0, token2, [pool_0_1, pool_1_2], 100, TradeType.EXACT_INPUT);
const exactInFromRoute1: Trade = tradeFromRoute(token0, token2, [pool_0_1, pool_1_2], 10000, TradeType.EXACT_INPUT);
const exactOutFromRoute0: Trade = tradeFromRoute(token0, token2, [pool_0_1, pool_1_2], 10000, TradeType.EXACT_OUTPUT);
const exactOutFromRoute1: Trade = tradeFromRoute(token0, token2, [pool_0_1, pool_1_2], 100, TradeType.EXACT_OUTPUT);

describe('Trade', () => {

  describe('createTradeFromRoute', () => {
    it('can be constructed with ETHER as input', () => {
      const trade: Trade = createTradeFromRoute({
        tradeRoute: {
          route: createRoute({
            pools: [pool_weth_0], 
            inToken: eth, 
            outToken: token0,
          }),
          amount: {
            token: eth,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_INPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(eth);
      expect(trade.outputAmount.token).toStrictEqual(token0);
    });

    it('can be constructed with ETHER as input for exact output',  () => {
      const trade: Trade = createTradeFromRoute({
        tradeRoute: {
          route: createRoute({
            pools: [pool_weth_0],
            inToken: eth,
            outToken: token0,
          }),
          amount: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_OUTPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(eth);
      expect(trade.outputAmount.token).toStrictEqual(token0);
    });

    it('can be constructed with ETHER as output', () => {
      const trade: Trade = createTradeFromRoute({
        tradeRoute: {
          route: createRoute({
            pools: [pool_weth_0],
            inToken: token0,
            outToken: eth,
          }),
          amount: {
            token: eth,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_OUTPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(token0);
      expect(trade.outputAmount.token).toStrictEqual(eth);
    });

    it('can be constructed with ETHER as output for exact input', () => {
      const trade: Trade = createTradeFromRoute({
        tradeRoute: {
          route: createRoute({
            pools: [pool_weth_0],
            inToken: token0,
            outToken: eth,
          }),
          amount: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_INPUT
      });
      expect(trade.inputAmount.token ).toStrictEqual(token0);
      expect(trade.outputAmount.token).toStrictEqual(eth);
    });
  });

  describe('createTradeFromRoutes', () => {
    it('can be constructed with ETHER as input with multiple routes', () => {
      const trade: Trade = createTradeFromRoutes({
        tradeRoutes: [{
          route: createRoute({
            pools: [pool_weth_0],
            inToken: eth,
            outToken: token0,
          }),
          amount: {
            token: eth,
            amount: BigInt.fromUInt16(10000),
          }
        }],
        tradeType: TradeType.EXACT_INPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(eth);
      expect(trade.outputAmount.token).toStrictEqual(token0);
    });

    it('can be constructed with ETHER as input for exact output with multiple routes', () => {
      const trade: Trade = createTradeFromRoutes({
        tradeRoutes: [
          {
            route: createRoute({
              pools: [pool_weth_0],
              inToken: eth,
              outToken: token0,
            }),
            amount: {
              token: token0,
              amount: BigInt.fromUInt16(3000),
            }
          },
          {
            route: createRoute({
              pools: [pool_weth_1, pool_0_1],
              inToken: eth,
              outToken: token0,
            }),
            amount: {
              token: token0,
              amount: BigInt.fromUInt16(7000),
            }
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(eth);
      expect(trade.outputAmount.token).toStrictEqual(token0);
    });

    it('can be constructed with ETHER as output with multiple routes', () => {
      const trade: Trade = createTradeFromRoutes({
        tradeRoutes: [
          {
            route: createRoute({
              pools: [pool_weth_0],
              inToken: token0,
              outToken: eth,
            }),
            amount: {
              token: eth,
              amount: BigInt.fromUInt16(4000),
            }
          },
          {
            route: createRoute({
              pools: [pool_0_1, pool_weth_1],
              inToken: token0,
              outToken: eth,
            }),
            amount: {
              token: eth,
              amount: BigInt.fromUInt16(6000),
            }
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(token0);
      expect(trade.outputAmount.token).toStrictEqual(eth);
    });

    it('can be constructed with ETHER as output for exact input with multiple routes', () => {
      const trade: Trade = createTradeFromRoutes({
        tradeRoutes: [
          {
            route: createRoute({
              pools: [pool_weth_0],
              inToken: token0,
              outToken: eth,
            }),
            amount: {
              token: token0,
              amount: BigInt.fromUInt16(3000),
            }
          },
          {
            route: createRoute({
              pools: [pool_0_1, pool_weth_1],
              inToken: token0,
              outToken: eth,
            }),
            amount: {
              token: token0,
              amount: BigInt.fromUInt16(6000),
            }
          },
        ],
        tradeType: TradeType.EXACT_INPUT
      });
      expect(trade.inputAmount.token).toStrictEqual(token0);
      expect(trade.outputAmount.token).toStrictEqual(eth);
    });

    it('throws if pools are re-used between routes', () => {
      const error = (): void => {
        createTradeFromRoutes({
          tradeRoutes: [
            {
              route: createRoute({
                pools: [pool_0_1, pool_weth_1],
                inToken: token0,
                outToken: eth,
              }),
              amount: {
                token: token0,
                amount: BigInt.fromUInt16(4500),
              }
            },
            {
              route: createRoute({
                pools: [pool_0_1, pool_1_2, pool_weth_2],
                inToken: token0,
                outToken: eth,
              }),
              amount: {
                token: token0,
                amount: BigInt.fromUInt16(5500),
              }
            },
          ],
          tradeType: TradeType.EXACT_INPUT
        });
      };
      expect(error).toThrow('POOLS_DUPLICATED: pools must be unique within and across routes');
    });
  });

  describe('createUncheckedTrade', () => {
    it('throws if input currency does not match route', () => {
      const error = (): void => {
        createUncheckedTrade({
          swap: {
            route: createRoute({
              pools: [pool_0_1],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token2,
              amount: BigInt.fromUInt16(10000),
            },
            outputAmount: {
              token: token1,
              amount: BigInt.fromUInt16(10000),
            }
          },
          tradeType: TradeType.EXACT_INPUT,
        });
      };
      expect(error).toThrow('INPUT_CURRENCY_MATCH: the input token of the trade and all its routes must match');
    });

    it('throws if output currency does not match route', () => {
      const error = (): void => {
        createUncheckedTrade({
          swap: {
            route: createRoute({
              pools: [pool_0_1],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token0,
              amount: BigInt.fromUInt16(10000),
            },
            outputAmount: {
              token: token2,
              amount: BigInt.fromUInt16(10000),
            }
          },
          tradeType: TradeType.EXACT_INPUT,
        });
      };
      expect(error).toThrow('OUTPUT_CURRENCY_MATCH: the output token of the trade and all its routes must match');
    });

    it('can create an exact input trade without simulating', () => {
      createUncheckedTrade({
        swap: {
          route: createRoute({
            pools: [pool_0_1],
            inToken: token0,
            outToken: token1,
          }),
          inputAmount: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          },
          outputAmount: {
            token: token1,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_INPUT,
      });
    });

    it('can create an exact output trade without simulating', () => {
      createUncheckedTrade({
        swap: {
          route: createRoute({
            pools: [pool_0_1],
            inToken: token0,
            outToken: token1,
          }),
          inputAmount: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          },
          outputAmount: {
            token: token1,
            amount: BigInt.fromUInt16(10000),
          }
        },
        tradeType: TradeType.EXACT_OUTPUT,
      });
    });
  });

  describe('createUncheckedTradeWithMultipleRoutes', () => {
    it('throws if input currency does not match route with multiple routes', () => {
      const error = (): void => {
        createUncheckedTradeWithMultipleRoutes({
          swaps: [
            {
              route: createRoute({
                pools: [pool_1_2],
                inToken: token2,
                outToken: token1,
              }),
              inputAmount: {
                token: token2,
                amount: BigInt.fromUInt16(2000),
              },
              outputAmount: {
                token: token1,
                amount: BigInt.fromUInt16(2000),
              }
            },
            {
              route: createRoute({
                pools: [pool_0_1],
                inToken: token0,
                outToken: token1,
              }),
              inputAmount: {
                token: token2,
                amount: BigInt.fromUInt16(8000),
              },
              outputAmount: {
                token: token1,
                amount: BigInt.fromUInt16(8000),
              }
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        });
      };
      expect(error).toThrow('INPUT_CURRENCY_MATCH: the input token of the trade and all its routes must match');
    });

    it('throws if output currency does not match route with multiple routes', () => {
      const error = (): void => {
        createUncheckedTradeWithMultipleRoutes({
          swaps: [
            {
              route: createRoute({
                pools: [pool_0_2],
                inToken: token0,
                outToken: token2,
              }),
              inputAmount: {
                token: token0,
                amount: BigInt.fromUInt16(10000),
              },
              outputAmount: {
                token: token2,
                amount: BigInt.fromUInt16(10000),
              }
            },
            {
              route: createRoute({
                pools: [pool_0_1],
                inToken: token0,
                outToken: token1,
              }),
              inputAmount: {
                token: token0,
                amount: BigInt.fromUInt16(10000),
              },
              outputAmount: {
                token: token2,
                amount: BigInt.fromUInt16(10000),
              }
            },
          ],
          tradeType: TradeType.EXACT_INPUT,
        });
      };
      expect(error).toThrow('OUTPUT_CURRENCY_MATCH: the output token of the trade and all its routes must match');
    });

    it('can create an exact input trade without simulating with multiple routes', () => {
      createUncheckedTradeWithMultipleRoutes({
        swaps: [
          {
            route: createRoute({
              pools: [pool_0_1],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token0,
              amount: BigInt.fromUInt16(5000),
            },
            outputAmount: {
              token: token1,
              amount: BigInt.fromUInt16(5000),
            }
          },
          {
            route: createRoute({
              pools: [pool_0_2, pool_1_2],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token0,
              amount: BigInt.fromUInt16(5000),
            },
            outputAmount: {
              token: token1,
              amount: BigInt.fromUInt16(5000),
            }
          },
        ],
        tradeType: TradeType.EXACT_INPUT,
      });
    });

    it('can create an exact output trade without simulating with multiple routes', () => {
      createUncheckedTradeWithMultipleRoutes({
        swaps: [
          {
            route: createRoute({
              pools: [pool_0_1],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token0,
              amount: BigInt.fromUInt16(5001),
            },
            outputAmount: {
              token: token1,
              amount: BigInt.fromUInt16(5000),
            }
          },
          {
            route: createRoute({
              pools: [pool_0_2, pool_1_2],
              inToken: token0,
              outToken: token1,
            }),
            inputAmount: {
              token: token0,
              amount: BigInt.fromUInt16(4999),
            },
            outputAmount: {
              token: token1,
              amount: BigInt.fromUInt16(5000),
            }
          },
        ],
        tradeType: TradeType.EXACT_OUTPUT,
      });
    });
  });

  describe('route and swaps', () => {
    it('can access routes for both single and multi route trades', () => {
      expect(exactIn.swaps).toHaveLength(1)
      expect(exactInMultiRoute0.swaps).toHaveLength(2)
    });
  });

  describe('tradeWorstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      it('throws if less than 0', () => {
        const error = (): void => {
          tradeWorstExecutionPrice({
            trade: exactIn,
            slippageTolerance: "-0.0001",
          });
        };
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const price: PriceType = tradeWorstExecutionPrice({
          trade: exactIn,
          slippageTolerance: "0",
        });
        expect(price).toStrictEqual(exactIn.executionPrice);
      });

      it('returns exact if nonzero', () => {
        const expected0: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(69)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactIn,
          slippageTolerance: "0",
        }).price).toStrictEqual(expected0);

        const expected0005: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(65)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactIn,
          slippageTolerance: "0.0005",
        }).price).toStrictEqual(expected0005);

        const expected002: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(23)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactIn,
          slippageTolerance: "0.02",
        }).price).toStrictEqual(expected002);
      });

      it('returns exact if nonzero with multiple routes', () => {
        const expected0: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(69)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactInMultiRoute0,
          slippageTolerance: "0",
        }).price).toStrictEqual(expected0);

        const expected0005: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(65)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactInMultiRoute0,
          slippageTolerance: "0.0005",
        }).price).toStrictEqual(expected0005);

        const expected002: string = new Price(token0, token2, BigInt.fromUInt16(100), BigInt.fromUInt16(23)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactInMultiRoute0,
          slippageTolerance: "0.02",
        }).price).toStrictEqual(expected002);
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {
      it('throws if less than 0', () => {
        const error = (): void => {
          tradeWorstExecutionPrice({
            trade: exactOut,
            slippageTolerance: "-0.0001",
          });
        };
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const price: PriceType = tradeWorstExecutionPrice({
          trade: exactOut,
          slippageTolerance: "0",
        });
        expect(price).toStrictEqual(exactOut.executionPrice);
      });

      it('returns slippage amount if nonzero', () => {
        const expected0: string = new Price(token0, token2, BigInt.fromUInt16(156), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOut,
          slippageTolerance: "0",
        }).price).toStrictEqual(expected0);

        const expected0005: string = new Price(token0, token2, BigInt.fromUInt16(163), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOut,
          slippageTolerance: "0.0005",
        }).price).toStrictEqual(expected0005);

        const expected002: string = new Price(token0, token2, BigInt.fromUInt16(468), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOut,
          slippageTolerance: "0.02",
        }).price).toStrictEqual(expected002);
      });

      it('returns exact if nonzero with multiple routes', () => {
        const expected0: string = new Price(token0, token2, BigInt.fromUInt16(156), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOutMultiRoute0,
          slippageTolerance: "0",
        }).price).toStrictEqual(expected0);

        const expected0005: string = new Price(token0, token2, BigInt.fromUInt16(163), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOutMultiRoute0,
          slippageTolerance: "0.0005",
        }).price).toStrictEqual(expected0005);

        const expected002: string = new Price(token0, token2, BigInt.fromUInt16(468), BigInt.fromUInt16(100)).toFixed(18);
        expect(tradeWorstExecutionPrice({
          trade: exactOutMultiRoute0,
          slippageTolerance: "0.02",
        }).price).toStrictEqual(expected002);
      });
    });
  });

  describe('tradePriceImpact', () => {
    describe('tradeType = EXACT_INPUT', () => {
      it('is correct', () => {
        expect(exactIn.priceImpact.substring(0, 5)).toStrictEqual('0.172')
      });

      it('is correct with multiple routes', () => {
        expect(exactInMultiRoute1.priceImpact.substring(0, 5)).toStrictEqual('0.198')
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {
      it('is correct', () => {
        expect(exactOut.priceImpact.substring(0, 5)).toStrictEqual('0.231')
      });

      it('is correct with multiple routes', () => {
        expect(exactOutMultiRoute1.priceImpact.substring(0, 5)).toStrictEqual('0.255')
      });
    });
  });

  describe('bestTradeExactIn', () => {
    it('throws with empty pools', () => {
      const error = (): void => {
        bestTradeExactIn({
          pools: [],
          amountIn: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          },
          tokenOut: token2,
          options: null,
        });
      };
      expect(error).toThrow("POOLS: pools array is empty");
    });

    it('throws with max hops of 0', () => {
      const error = (): void => {
        bestTradeExactIn({
          pools: [pool_0_2],
          amountIn: {
            token: token0,
            amount: BigInt.fromUInt16(10000),
          },
          tokenOut: token2,
          options: {
            maxHops: Nullable.fromValue<u32>(0),
            maxNumResults: Nullable.fromNull<u32>(),
          },
        });
      };
      expect(error).toThrow("MAX_HOPS: maxHops must be greater than zero");
    });

    it('provides best route', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        amountIn: {
          token: token0,
          amount: BigInt.fromUInt16(10000),
        },
        tokenOut: token2,
        options: null,
      });
      expect(result).toHaveLength(2);
      expect(result[0].swaps[0].route.pools).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.path).toStrictEqual([token0, token2]);
      expect(result[0].inputAmount).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(10000) });
      expect(result[0].outputAmount).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(9971) });
      expect(result[1].swaps[0].route.pools).toHaveLength(2); // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].swaps[0].route.path).toStrictEqual([token0, token1, token2]);
      expect(result[1].inputAmount).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(10000) });
      expect(result[1].outputAmount).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(7004) });
    });

    it('respects maxHops', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        amountIn: {
          token: token0,
          amount: BigInt.fromUInt16(10),
        },
        tokenOut: token2,
        options: {
          maxHops: Nullable.fromValue<u32>(1),
          maxNumResults: Nullable.fromNull<u32>(),
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].swaps[0].route.pools).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.path).toStrictEqual([token0, token2]);
    });

    it('insufficient input for one pool', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        amountIn: {
          token: token0,
          amount: BigInt.fromUInt16(1),
        },
        tokenOut: token2,
        options: null,
      });
      expect(result).toHaveLength(2);
      expect(result[0].swaps[0].route.pools).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.path).toStrictEqual([token0, token2]);
      expect(result[0].outputAmount).toStrictEqual({ token: token2, amount: BigInt.ZERO });
    });

    it('respects n', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        amountIn: {
          token: token0,
          amount: BigInt.fromUInt16(10),
        },
        tokenOut: token2,
        options: {
          maxHops: Nullable.fromNull<u32>(),
          maxNumResults: Nullable.fromValue<u32>(1),
        },
      });
      expect(result).toHaveLength(1);
    });

    it('no path', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_0_1, pool_0_3, pool_1_3],
        amountIn: {
          token: token0,
          amount: BigInt.fromUInt16(10),
        },
        tokenOut: token2,
        options: null,
      });
      expect(result).toHaveLength(0);
    });

    it('works for ETHER currency input', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
        amountIn: {
          token: eth,
          amount: BigInt.fromUInt16(100),
        },
        tokenOut: token3,
        options: null,
      });
      expect(result).toHaveLength(2);
      expect(result[0].inputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[0].swaps[0].route.path).toStrictEqual([getWETH(ChainId.MAINNET), token0, token1, token3]);
      expect(result[0].outputAmount.token).toStrictEqual(token3);
      expect(result[1].inputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[1].swaps[0].route.path).toStrictEqual([getWETH(ChainId.MAINNET), token0, token3]);
      expect(result[1].outputAmount.token).toStrictEqual(token3);
    });

    it('works for ETHER currency output', () => {
      const result: Trade[] = bestTradeExactIn({
        pools: [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
        amountIn: {
          token: token3,
          amount: BigInt.fromUInt16(100),
        },
        tokenOut: eth,
        options: null,
      });
      expect(result).toHaveLength(2);
      expect(result[0].inputAmount.token).toStrictEqual(token3);
      expect(result[0].swaps[0].route.path).toStrictEqual([token3, token0, getWETH(ChainId.MAINNET)]);
      expect(result[0].outputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[1].inputAmount.token).toStrictEqual(token3);
      expect(result[1].swaps[0].route.path).toStrictEqual([token3, token1, token0, getWETH(ChainId.MAINNET)]);
      expect(result[1].outputAmount.token.currency).toStrictEqual(ETHER);
    });
  });

  describe('tradeMaximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {

      it('throws if less than 0', () => {
        const error = (): void => {
          tradeMaximumAmountIn({
            slippageTolerance: "-0.0001",
            amountIn: exactInFromRoute0.inputAmount,
            tradeType: exactInFromRoute0.tradeType,
          });
        };
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const result: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0",
          amountIn: exactInFromRoute0.inputAmount,
          tradeType: exactInFromRoute0.tradeType,
        });
        expect(result).toStrictEqual(exactInFromRoute0.inputAmount);
      });

      it('returns exact if nonzero', () => {
        const amount0: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0",
          amountIn: exactInFromRoute0.inputAmount,
          tradeType: exactInFromRoute0.tradeType
        });
        expect(amount0).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(100) });

        const amount0005: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0.0005",
          amountIn: exactInFromRoute0.inputAmount,
          tradeType: exactInFromRoute0.tradeType
        });
        expect(amount0005).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(100) });

        const amount02: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0.02",
          amountIn: exactInFromRoute0.inputAmount,
          tradeType: exactInFromRoute0.tradeType
        });
        expect(amount02).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(100) });
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {

      it('throws if less than 0', () => {
        const error = (): void => {
          tradeMaximumAmountIn({
            slippageTolerance: "-0.0001",
            amountIn: exactOutFromRoute0.inputAmount,
            tradeType: exactOutFromRoute0.tradeType,
          });
        }
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const result: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0",
          amountIn: exactOutFromRoute0.inputAmount,
          tradeType: exactOutFromRoute0.tradeType,
        });
        expect(result).toStrictEqual(exactOutFromRoute0.inputAmount);
      });

      it('returns slippage amount if nonzero', () => {
        const amount0: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0",
          amountIn: exactOutFromRoute0.inputAmount,
          tradeType: exactOutFromRoute0.tradeType
        });
        expect(amount0).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(15488) });

        const amount0005: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0.0005",
          amountIn: exactOutFromRoute0.inputAmount,
          tradeType: exactOutFromRoute0.tradeType
        });
        expect(amount0005).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(16262) });

        const amount02: TokenAmount = tradeMaximumAmountIn({
          slippageTolerance: "0.02",
          amountIn: exactOutFromRoute0.inputAmount,
          tradeType: exactOutFromRoute0.tradeType
        });
        expect(amount02).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(46464) });
      });
    });
  });

  describe('tradeMinimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {

      it('throws if less than 0', () => {
        const error = (): void => {
          tradeMinimumAmountOut({
            slippageTolerance: "-0.0001",
            amountOut: exactInFromRoute1.outputAmount,
            tradeType: exactInFromRoute1.tradeType,
          });
        };
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const result: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0",
          amountOut: exactInFromRoute1.outputAmount,
          tradeType: exactInFromRoute1.tradeType,
        });
        expect(result).toStrictEqual(exactInFromRoute1.outputAmount);
      });

      it('returns exact if nonzero', () => {
        const amount0: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0",
          amountOut: exactInFromRoute1.outputAmount,
          tradeType: exactInFromRoute1.tradeType,
        });
        expect(amount0).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(7004) });

        const amount0005: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0.0005",
          amountOut: exactInFromRoute1.outputAmount,
          tradeType: exactInFromRoute1.tradeType,
        });
        expect(amount0005).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(6670) });

        const amount02: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0.02",
          amountOut: exactInFromRoute1.outputAmount,
          tradeType: exactInFromRoute1.tradeType,
        });
        expect(amount02).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(2334) });
      });
    });

    describe('tradeType = EXACT_OUTPUT', () => {

      it('throws if less than 0', () => {
        const error = (): void => {
          tradeMinimumAmountOut({
            slippageTolerance: "-0.0001",
            amountOut: exactOutFromRoute1.outputAmount,
            tradeType: exactOutFromRoute1.tradeType,
          });
        };
        expect(error).toThrow("SLIPPAGE_TOLERANCE: slippage tolerance cannot be less than zero");
      });

      it('returns exact if 0', () => {
        const result: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0",
          amountOut: exactOutFromRoute1.outputAmount,
          tradeType: exactOutFromRoute1.tradeType,
        });
        expect(result).toStrictEqual(exactOutFromRoute1.outputAmount);
      });

      it('returns slippage amount if nonzero', () => {
        const amount0: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0",
          amountOut: exactOutFromRoute1.outputAmount,
          tradeType: exactOutFromRoute1.tradeType,
        });
        expect(amount0).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(100) });

        const amount0005: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0.0005",
          amountOut: exactOutFromRoute1.outputAmount,
          tradeType: exactOutFromRoute1.tradeType,
        });
        expect(amount0005).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(1000) });

        const amount02: TokenAmount = tradeMinimumAmountOut({
          slippageTolerance: "0.02",
          amountOut: exactOutFromRoute1.outputAmount,
          tradeType: exactOutFromRoute1.tradeType,
        });
        expect(amount02).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(100) });
      });
    });
  });

  describe('bestTradeExactOut', () => {

    it('throws with empty pools', () => {
      const error = (): void => {
        bestTradeExactOut({
          pools: [],
          tokenIn: token0,
          amountOut: {
            token: token2,
            amount: BigInt.fromUInt16(100),
          },
          options: null,
        });
      };
      expect(error).toThrow("POOLS: pools array is empty");
    });

    it('throws with max hops of 0', () => {
      const error = (): void => {
        bestTradeExactOut({
          pools: [pool_0_2],
          tokenIn: token0,
          amountOut: {
            token: token2,
            amount: BigInt.fromUInt16(100),
          },
          options: {
            maxHops: Nullable.fromValue<u32>(0),
            maxNumResults: Nullable.fromNull<u32>(),
          },
        });
      };
      expect(error).toThrow("MAX_HOPS: maxHops must be greater than zero");
    });

    it('provides best route', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(10000),
        },
        options: null,
      });
      expect(result).toHaveLength(2);
      expect(result[0].swaps[0].route.pools).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.path).toStrictEqual([token0, token2]);
      expect(result[0].inputAmount).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(10032) });
      expect(result[0].outputAmount).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(10000) });
      expect(result[1].swaps[0].route.pools).toHaveLength(2); // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].swaps[0].route.path).toStrictEqual([token0, token1, token2]);
      expect(result[1].inputAmount).toStrictEqual({ token: token0, amount: BigInt.fromUInt16(15488) });
      expect(result[1].outputAmount).toStrictEqual({ token: token2, amount: BigInt.fromUInt16(10000) });
    });

    it('respects maxHops', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(10),
        },
        options: {
          maxHops: Nullable.fromValue<u32>(1),
          maxNumResults: Nullable.fromNull<u32>(),
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].swaps[0].route.pools).toHaveLength(1); // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.path).toStrictEqual([token0, token2]);
    });

    it('insufficient liquidity', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(1200),
        },
        options: null
      });
      expect(result).toHaveLength(0);
    });

    it('insufficient liquidity in one pool but not the other', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(1050),
        },
        options: null
      });
      expect(result).toHaveLength(1);
    });

    it('respects n', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_2, pool_1_2],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(10),
        },
        options: {
          maxHops: Nullable.fromNull<u32>(),
          maxNumResults: Nullable.fromValue<u32>(1),
        }
      });
      expect(result).toHaveLength(1);
    });

    it('no path', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_0_1, pool_0_3, pool_1_3],
        tokenIn: token0,
        amountOut: {
          token: token2,
          amount: BigInt.fromUInt16(10),
        },
        options: null
      });
      expect(result).toHaveLength(0);
    })

    it('works for ETHER currency input', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
        tokenIn: eth,
        amountOut: {
          token: token3,
          amount: BigInt.fromUInt16(10000),
        },
        options: null
      });
      expect(result).toHaveLength(2);
      expect(result[0].inputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[0].swaps[0].route.path).toStrictEqual([getWETH(ChainId.MAINNET), token0, token1, token3]);
      expect(result[0].outputAmount.token).toStrictEqual(token3);
      expect(result[1].inputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[1].swaps[0].route.path).toStrictEqual([getWETH(ChainId.MAINNET), token0, token3]);
      expect(result[1].outputAmount.token).toStrictEqual(token3);
    });

    it('works for ETHER currency output', () => {
      const result: Trade[] = bestTradeExactOut({
        pools: [pool_weth_0, pool_0_1, pool_0_3, pool_1_3],
        tokenIn: token3,
        amountOut: {
          token: eth,
          amount: BigInt.fromUInt16(100),
        },
        options: null
      });
      expect(result).toHaveLength(2);
      expect(result[0].inputAmount.token).toStrictEqual(token3);
      expect(result[0].swaps[0].route.path).toStrictEqual([token3, token0, getWETH(ChainId.MAINNET)]);
      expect(result[0].outputAmount.token.currency).toStrictEqual(ETHER);
      expect(result[1].inputAmount.token).toStrictEqual(token3);
      expect(result[1].swaps[0].route.path).toStrictEqual([token3, token1, token0, getWETH(ChainId.MAINNET)]);
      expect(result[1].outputAmount.token.currency).toStrictEqual(ETHER);
    });
  });
});