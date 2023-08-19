import { Protobuf, System, token } from "@koinos/sdk-as";
import { v2core } from "../proto/v2core"
import { error } from "@koinos/sdk-as";
import { Reserves } from "./Interfaces";

enum entries {
  // base
  mint_entry = 0xdc6f17bb,
  burn_entry = 0x859facc5,
  balance_of_entry = 0x5c721497,
  transfer_entry = 0x27f576ca,
  // core
  initialize_entry = 0x470ebe82,
  swap_entry = 0xda47c2f4,
  get_reserves_entry = 0x6d0c5abf,
}

export class Core {
  _contractId: Uint8Array;
  constructor(contractId: Uint8Array) {
    this._contractId = contractId;
  }
  get_reserves(): Reserves {
    const args = new v2core.get_reserves_arguments();
    const callRes = System.call(this._contractId, entries.get_reserves_entry, Protobuf.encode(args, v2core.get_reserves_arguments.encode));
    System.require(callRes.code == 0, "failed to retrieve token symbol");
    const res = Protobuf.decode<v2core.get_reserves_result>(callRes.res.object as Uint8Array, v2core.get_reserves_result.decode);
    return new Reserves(res.reserve_a, res.reserve_b);
  }
  mint(to: Uint8Array, fee: Uint8Array): u64 {
    const args = new v2core.mint_arguments(to, fee);
    const callRes = System.call(this._contractId, entries.mint_entry, Protobuf.encode(args, v2core.mint_arguments.encode));
    System.require(callRes.code == 0, "failed to retrieve token symbol");
    const res = Protobuf.decode<v2core.uint64>(callRes.res.object as Uint8Array, v2core.uint64.decode);
    return res.value;
  }
  burn(to: Uint8Array, fee: Uint8Array): v2core.burn_result {
    const args = new v2core.burn_arguments(to, fee);
    const callRes = System.call(this._contractId, entries.burn_entry, Protobuf.encode(args, v2core.burn_arguments.encode));
    System.require(callRes.code == 0, "failed to retrieve token symbol");
    const res = Protobuf.decode<v2core.burn_result>(callRes.res.object as Uint8Array, v2core.burn_result.decode);
    return res;
  }
  initialize(token_a: v2core.token_object, token_b: v2core.token_object): boolean {
    const args = new v2core.initialize_arguments(token_a, token_b);
    const callRes = System.call(this._contractId, entries.initialize_entry, Protobuf.encode(args, v2core.initialize_arguments.encode));
    return callRes.code == error.error_code.success;
  }
  swap(to: Uint8Array, amount_a: u64, amount_b: u64): boolean {
    const args = new v2core.swap_arguments(to, amount_a, amount_b);
    const callRes = System.call(this._contractId, entries.swap_entry, Protobuf.encode(args, v2core.swap_arguments.encode));
    return callRes.code == error.error_code.success;
  }
  balanceOf(owner: Uint8Array): u64 {
    const args = new token.balance_of_arguments(owner);
    const callRes = System.call(this._contractId, entries.balance_of_entry, Protobuf.encode(args, token.balance_of_arguments.encode));
    System.require(callRes.code == 0, "failed to retrieve token balance");
    const res = Protobuf.decode<token.balance_of_result>(callRes.res.object as Uint8Array, token.balance_of_result.decode);
    return res.value;
  }
  transfer(from: Uint8Array, to: Uint8Array, amount: u64): bool {
    const args = new token.transfer_arguments(from, to, amount);
    const callRes = System.call(this._contractId, entries.transfer_entry, Protobuf.encode(args, token.transfer_arguments.encode));
    return callRes.code == error.error_code.success;
  }
}