import { Base58, System, value, u128, SafeMath, Protobuf } from "@koinos/sdk-as";

export class SortTokens {
  token0: string;
  token1: string;

  constructor(token0: string, token1: string) {
    this.token0 = token0;
    this.token1 = token1;
  }
}


export class Lib {
  static getCaller(from: Uint8Array): Uint8Array {
    const caller = System.getCaller();
    if(caller.caller.length) {
      return caller.caller as Uint8Array;
    }
    return from;
  }

  static arrayToUint8Array(a: Array<u8>): Uint8Array {
    let uArray = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++)
      uArray[i] = a[i];
    return uArray;
  }

  static sortTokens(tokenA: string, tokenB: string): SortTokens {
    if(tokenA > tokenB) {
      return new SortTokens(tokenA, tokenB);
    } else {
      return new SortTokens(tokenB, tokenA);
    }
  }
  static getQuote(amountA: u64, reserve_a: u64, reserve_b: u64): u64 {
    System.require( amountA>0, 'lib: INSUFFICIENT_AMOUNT', 1 );
    System.require( (reserve_a>0 && reserve_b>0) , 'lib: INSUFFICIENT_LIQUIDITY', 1 );

    // data in u128
    let _amountA = u128.fromU64(amountA);
    let _reserveA = u128.fromU64(reserve_a);
    let _reserveB = u128.fromU64(reserve_b);

    // process
    // let _num = _amountA * _reserveB;
    // let result = _num / _reserveA;
    let _num = SafeMath.mul(_amountA, _reserveB);
    let result = SafeMath.div(_num, _reserveA);
    return result.toU64();
  }
  static getAmountOut(amountIn: u64, reserveIn: u64, reserveOut: u64): u64 {
    System.require(amountIn>0, 'LIB:  INSUFFICIENT_INPUT_AMOUNT', 1);
    System.require( reserveIn>0 && reserveOut>0, 'LIB:  INSUFFICIENT_LIQUIDITY', 1);

    // data in u128
    let _amountIn = u128.fromU64(amountIn);
    let _reserveIn = u128.fromU64(reserveIn);
    let _reserveOut = u128.fromU64(reserveOut);
    let _9975 = u128.fromU64(9975);
    let _10000 = u128.fromU64(10000);

    // process
    const amountInWithFee = SafeMath.mul(_amountIn, _9975);
    const numerator = SafeMath.mul(amountInWithFee, _reserveOut);
    const denominator = SafeMath.add(SafeMath.mul(_reserveIn, _10000), amountInWithFee);
    const result = SafeMath.div(numerator, denominator);
    return result.toU64();
  }
  static getAmountIn(amountOut: u64, reserveIn: u64, reserveOut: u64): u64 {
    System.require( amountOut>0, 'LIB:  INSUFFICIENT_OUTPUT_AMOUNT', 1);
    System.require( reserveIn>0 && reserveOut>0, 'LIB:  INSUFFICIENT_LIQUIDITY', 1);

    // data in u128
    let _amountOut = u128.fromU64(amountOut);
    let _reserveIn = u128.fromU64(reserveIn);
    let _reserveOut = u128.fromU64(reserveOut);
    let _9975 = u128.fromU64(9975);
    let _10000 = u128.fromU64(10000);
    let _1 = u128.fromU64(1);

    // process
    const numerator = SafeMath.mul(SafeMath.mul(_reserveIn, _amountOut), _10000);
    const denominator = SafeMath.mul(SafeMath.sub(_reserveOut, _amountOut), _9975);
    const result = SafeMath.add(SafeMath.div(numerator, denominator), _1);
    return result.toU64();
  }
}