import { System, Storage, Arrays, authority, Token, Base58, Crypto } from "@koinos/sdk-as";
import { periphery } from "./proto/periphery";
import { Spaces } from "./Spaces";
import { Lib, SortTokens } from "./libraries/Lib";
import { Constants } from "./Contants";
import { Core } from "./libraries/V2Core";
import { Amounts, Reserves, Swaps } from "./libraries/Interfaces";

const EmptyAddress = Base58.decode("");

export class Periphery {
  contractId: Uint8Array;
  
  // spaces
  config: Storage.Obj<periphery.configs_object>;
  pairs: Storage.ProtoMap<periphery.pair_key, periphery.address>;

  constructor() {
    this.contractId = System.getContractId();

    this.config = new Storage.Obj(
      this.contractId,
      Spaces.CONFIGS_SPACE_ID,
      periphery.configs_object.decode,
      periphery.configs_object.encode,
      () => new periphery.configs_object()
    );
    this.pairs = new Storage.ProtoMap(
      this.contractId,
      Spaces.PAIRS_SPACE_ID,
      periphery.pair_key.decode,
      periphery.pair_key.encode,
      periphery.address.decode,
      periphery.address.encode,
      () => new periphery.address()
    );
  }

  authorize_update(args: periphery.authorize_update_arguments): periphery.boole {
    let res = new periphery.boole()
    return res;
  }
  get_config(args: periphery.get_config_arguments): periphery.configs_object {
    let res = this.config.get()!;
    return res;
  }
  set_config(args: periphery.set_config_arguments): periphery.empty_object {
    let res = new periphery.empty_object();
    let caller = System.getCaller();
    if(caller.caller.length && Constants.GOVERNANCE_CONTRACT_ID.length) {
      System.require(Arrays.equal(caller.caller, Constants.GOVERNANCE_CONTRACT_ID), 'KOINDX: FORBIDDEN', 1);
    } else {
      System.require(System.checkAuthority(authority.authorization_type.contract_call, this.contractId), 'KOINDX: FORBIDDEN_CONFIG', 1);
    }
    if(args.value) {
      this.config.put(args.value!);
    } else {
      System.fail("KOINDX: CONFIG_CANNOT_BE_NULL")
    }
    return res;
  }
  get_pair(args: periphery.get_pair_arguments): periphery.address {
    let tokens: SortTokens = Lib.sortTokens(args.token_a, args.token_b);
    let key = new periphery.pair_key(tokens.token0, tokens.token1);
    let pair = this.pairs.get(key)!;
    return new periphery.address(pair.value);
  }
  create_pair(args: periphery.create_pair_arguments): periphery.empty_object {
    System.setSystemBufferSize(527360)
    let transaction  = System.getTransaction()
    let pool_address: Uint8Array = EmptyAddress;
    let hash_base = Lib.arrayToUint8Array([ 18,32,60,220,159,56,220,253,184,249,112,139,61,161,100,237,183,144,152,121,38,72,38,72,45,95,182,98,96,242,196,135,113,137 ])
    let hash_bytecode: Uint8Array = new Uint8Array(0);
    let authority_overrides: boolean = true;
    for (let index = 0; index < transaction.operations.length; index++) {
      const op = transaction.operations[index];
      if (op.upload_contract != null) {
        let contract = op.upload_contract!;
        pool_address = contract.contract_id
        hash_bytecode = System.hash(Crypto.multicodec.sha2_256, contract.bytecode)!;
        if(contract.authorizes_call_contract == false) {
          authority_overrides = false
        }
        if(contract.authorizes_transaction_application == false) {
          authority_overrides = false
        }
        if(contract.authorizes_upload_contract == false) {
          authority_overrides = false
        }
      }
    }
    let tokens: SortTokens = Lib.sortTokens(args.token_a, args.token_b);
    let key = new periphery.pair_key(tokens.token0, tokens.token1);
    let pair = this.pairs.get(key)!;
    let pool = new Core(pool_address);    
    // checks
    System.require(Arrays.equal(hash_bytecode, hash_base), "KOINDX: INVALID_HASH", 1); // we need to validate in sha256
    System.require(transaction.operations.length == 2, "KOINDX: MAX_OPERATIONS", 1);
    System.require(authority_overrides, "KOINDX: FAIL_AUTHORITY_OVERRIDES", 1);
    System.require(pool_address.length, "KOINDX: POOL_INVALID", 1);
    System.require(!pair.value.length, "KOINDX: PAIR_INITIALIZED", 1);
    System.require(!Arrays.equal(tokens.token0, EmptyAddress), "KOINDX: INVALID_TOKEN_A", 1);
    System.require(!Arrays.equal(tokens.token1, EmptyAddress), "KOINDX: INVALID_TOKEN_B", 1);
    System.require(!Arrays.equal(tokens.token0, tokens.token1), "KOINDX: TOKENS_MUST_BE_DIFFERENT", 1);
    System.require(pool.initialize(tokens.token0, tokens.token1), "KOINDX: COULD_NOT_INITIALIZE_THE_CORE", 1);
    pair.value = pool_address;
    this.pairs.put(key, pair)
    return new periphery.empty_object();
  }
  add_liquidity(args: periphery.add_liquidity_arguments): periphery.add_liquidity_result {
    let config = this.config.get()!;      
    let tokens: SortTokens = Lib.sortTokens(args.token_a, args.token_b);
    let key = new periphery.pair_key(tokens.token0, tokens.token1);
    let pair = this.pairs.get(key)!;
    let pool = new Core(pair.value);
    System.require(pair.value.length, "KOINDX: PAIR_NOT_INITIALIZED", 1);
    System.require((args.amount_a_desired>0 || args.amount_b_desired>0 || args.amount_a_min>0 || args.amount_b_min>0), "KOINDX: INVALID_AMOUNTS", 1);
    let amounts = this._addLiquidity(pool, args.amount_a_desired, args.amount_b_desired, args.amount_a_min, args.amount_b_min);
    // transfer tokens
    let caller = Lib.getCaller();
    let token_a = new Token(tokens.token0);
    let token_b = new Token(tokens.token1);
    System.require(token_a.transfer(caller, pair.value, amounts.amountA), "KOINDX: FAIL_TRANSFER_TOKEN_A", 1);
    System.require(token_b.transfer(caller, pair.value, amounts.amountB), "KOINDX: FAIL_TRANSFER_TOKEN_B", 1);
    // mint liquidity
    let _fee: Uint8Array = EmptyAddress;
    if(config.fee_on) {
      _fee = config.fee_to
    }
    let liquidity = pool.mint(caller, _fee)
    return new periphery.add_liquidity_result(liquidity, amounts.amountA, amounts.amountB);
  }
  remove_liquidity(args: periphery.remove_liquidity_arguments): periphery.remove_liquidity_result {    
    let config = this.config.get()!;      
    let tokens: SortTokens = Lib.sortTokens(args.token_a, args.token_b);
    let key = new periphery.pair_key(tokens.token0, tokens.token1);
    let pair = this.pairs.get(key)!;
    let pool = new Core(pair.value);
    System.require(pair.value.length, "KOINDX: PAIR_NOT_INITIALIZED", 1);
    // transfer liquidity
    let caller = Lib.getCaller();
    System.require(pool.transfer(caller, pair.value, args.liquidity), "KOINDX: COULD_NOT_TRANSFER_LIQUIDITY", 1);
    let _fee: Uint8Array = EmptyAddress;
    if(config.fee_on) {
      _fee = config.fee_to
    }
    let amount = pool.burn(caller, _fee);
    System.require(amount.amount_a >= args.amount_a_min, "KOINDX: INSUFFICIENT_A_AMOUNT", 1);
    System.require(amount.amount_b >= args.amount_b_min, "KOINDX: INSUFFICIENT_B_AMOUNT", 1);
    return new periphery.remove_liquidity_result(amount.amount_a, amount.amount_b);
  }
  swap_tokens_in(args: periphery.swap_tokens_in_arguments): periphery.empty_object {
    let caller = Lib.getCaller();
    let paths = Lib.stringPathsToByte(args.path)
    let results: Swaps = this._getAmountsOut(args.amount_in, paths);
    let amounts = results.amounts;
    let address = results.address;
    System.require(amounts[amounts.length - 1] >= args.amount_out_min, "KOINDX: INSUFFICIENT_OUTPUT_AMOUNT", 1);
    let token0 = new Token(paths[0]);
    System.require(token0.transfer(caller, results.address[0], amounts[0]), "KOINDX: FAIL_TRANSFER_TOKEN_0", 1);
    this._swaps(amounts, paths, address, caller);
    return new periphery.empty_object();
  }
  swap_tokens_out(args: periphery.swap_tokens_out_arguments): periphery.empty_object {
    let caller = Lib.getCaller();
    let paths = Lib.stringPathsToByte(args.path);
    let results: Swaps = this._getAmountsIn(args.amount_out, paths);
    let amounts = results.amounts;
    let address = results.address;
    System.require(amounts[0] <= args.amount_out, "KOINDX: EXCESSIVE_INPUT_AMOUNT", 1);
    let token0 = new Token(paths[0]);
    System.require(token0.transfer(caller, results.address[0], amounts[0]), "KOINDX: FAIL_TRANSFER_TOKEN_0", 1);
    this._swaps(amounts, paths, address, caller);
    return new periphery.empty_object();
  }

  // utils
  get_quote(args: periphery.get_quote_arguments): periphery.uint64 {
    let res = Lib.getQuote(args.amount, args.reserve_a, args.reserve_b);
    return new periphery.uint64(res);
  }
  get_amount_in(args: periphery.get_amount_in_arguments): periphery.uint64 {
    let res = Lib.getAmountIn(args.amount_out, args.reserve_a, args.reserve_b);
    return new periphery.uint64(res);
  }
  get_amount_out(args: periphery.get_amount_out_arguments): periphery.uint64 {
    let res = Lib.getAmountOut(args.amount_in, args.reserve_a, args.reserve_b);
    return new periphery.uint64(res);
  }

  private _addLiquidity(pool: Core, amountADesired: u64, amountBDesired: u64, amountAMin: u64, amountBMin: u64): Amounts {
    let amountA: u64;
    let amountB: u64;
    let reserves: Reserves = pool.get_reserves()
    let reserveA = reserves.reserveA;
    let reserveB = reserves.reserveB;
    if (reserves.reserveA == 0 && reserves.reserveB == 0) {
      amountA = amountADesired;
      amountB = amountBDesired;
    } else {
      let amountBOptimal = Lib.getQuote(amountADesired, reserveA, reserveB);
      if (amountBOptimal <= amountBDesired) {
        System.require(amountBOptimal >= amountBMin, 'KOINDX: INSUFFICIENT_B_AMOUNT', 1);
        amountA = amountADesired;
        amountB = amountBOptimal;
      } else {
        let amountAOptimal = Lib.getQuote(amountBDesired, reserveB, reserveA);
        System.require(amountAOptimal <= amountADesired, '', 1);
        System.require(amountAOptimal >= amountAMin, 'KOINDX: INSUFFICIENT_A_AMOUNT', 1);
        amountA = amountAOptimal;
        amountB = amountBDesired;
      }
    }
    return new Amounts(amountA, amountB);
  }

  private _getAmountsIn(amount: u64, paths: Uint8Array[]): Swaps {
    System.require(paths.length >= 2, "KOINDX: INVALID_PATH");
    let _amounts: u64[] = new Array(paths.length);
    let _address: Uint8Array[] = new Array(paths.length - 1);
    _amounts[0] = amount;
    for (let i = 0; i < paths.length - 1; i++) {
      let _tokens = Lib.sortTokens(paths[i], paths[i + 1]);
      let key = new periphery.pair_key(_tokens.token0, _tokens.token1);
      let pair = this.pairs.get(key)!;
      let pool = new Core(pair.value);
      // ajusted
      let reserves = pool.get_reserves();
      System.require(reserves.reserveA > 0 && reserves.reserveB > 0, "KOINDX: RESERVE_INSUFFICIENT", 1);
      let TokenAmountAjusted: u64;
      if(Arrays.equal(paths[i], _tokens.token0)) {
        TokenAmountAjusted = Lib.getAmountOut(_amounts[i], reserves.reserveA, reserves.reserveB);
      } else {
        TokenAmountAjusted = Lib.getAmountOut(_amounts[i], reserves.reserveB, reserves.reserveB);
      }
      System.require(isFinite(TokenAmountAjusted), "KOINDX: IS_FINITE", 1);
      _address[ i ] = pair.value;
      _amounts[ i + 1] = TokenAmountAjusted;
    }
    return new Swaps(_amounts, _address);
  }
  private _getAmountsOut(amount: u64, paths: Uint8Array[]): Swaps {
    System.require(paths.length >= 2, "KOINDX: INVALID_PATH");
    let _amounts: u64[] = new Array(paths.length);
    let _address: Uint8Array[] = new Array(paths.length - 1);
    _amounts[_amounts.length - 1] = amount;
    for (let i = paths.length - 1; i > 0; i--) {
      let _tokens = Lib.sortTokens(paths[i], paths[i - 1]);
      let key = new periphery.pair_key(_tokens.token0, _tokens.token1);
      let pair = this.pairs.get(key)!;
      let pool = new Core(pair.value);
      // ajusted
      let reserves = pool.get_reserves();
      System.require(reserves.reserveA > 0 && reserves.reserveB > 0, "KOINDX: RESERVE_INSUFFICIENT", 1);
      let TokenAmountAjusted: u64;
      if(Arrays.equal(paths[ i - 1 ], _tokens.token0)) {
        TokenAmountAjusted = Lib.getAmountIn(_amounts[i], reserves.reserveA, reserves.reserveB);
      } else {
        TokenAmountAjusted = Lib.getAmountIn(_amounts[i], reserves.reserveB, reserves.reserveA);
      }
      System.require(isFinite(TokenAmountAjusted), "KOINDX: IS_FINITE", 1);
      _address[ i ] = pair.value;
      _amounts[ i - 1] = TokenAmountAjusted;
    }
    return new Swaps(_amounts, _address);
  }
  private _swaps(amounts: u64[], paths: Uint8Array[], address: Uint8Array[], caller: Uint8Array): void {
    for (let i = 0; i < paths.length - 1; i++) {
      let input = paths[i];
      let output = paths[i + 1];
      let tokens = Lib.sortTokens(input, output);
      let amountOut = amounts[i + 1];
      let amount0Out = (input == tokens.token0 ? 0 : amountOut);
      let amount1Out = (input == tokens.token0 ? amountOut : 0);
      let pool = new Core(address[ i ])
      let to = i < paths.length - 2 ? address[ i ] : caller;
      System.require(pool.swap(to, amount0Out, amount1Out), "KOINDX: FAIL_SWAP", 1);
    }
  }
}
