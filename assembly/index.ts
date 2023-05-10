import { System, Protobuf, authority } from "@koinos/sdk-as";
import { Periphery as ContractClass } from "./Periphery";
import { periphery as ProtoNamespace } from "./proto/periphery";

export function main(): i32 {
  const contractArgs = System.getArguments();
  let retbuf = new Uint8Array(1024);

  const c = new ContractClass();

  switch (contractArgs.entry_point) {
    case 0x901f93db: {
      const args = Protobuf.decode<ProtoNamespace.authorize_update_arguments>(
        contractArgs.args,
        ProtoNamespace.authorize_update_arguments.decode
      );
      const res = c.authorize_update(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.boole.encode);
      break;
    }

    case 0xbc4fcdd4: {
      const args = Protobuf.decode<ProtoNamespace.get_config_arguments>(
        contractArgs.args,
        ProtoNamespace.get_config_arguments.decode
      );
      const res = c.get_config(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.configs_object.encode);
      break;
    }

    case 0x4ba58c89: {
      const args = Protobuf.decode<ProtoNamespace.set_config_arguments>(
        contractArgs.args,
        ProtoNamespace.set_config_arguments.decode
      );
      const res = c.set_config(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.empty_object.encode);
      break;
    }

    case 0xefdc45c1: {
      const args = Protobuf.decode<ProtoNamespace.get_pair_arguments>(
        contractArgs.args,
        ProtoNamespace.get_pair_arguments.decode
      );
      const res = c.get_pair(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.address.encode);
      break;
    }

    case 0xe0f47477: {
      const args = Protobuf.decode<ProtoNamespace.initialize_pair_arguments>(
        contractArgs.args,
        ProtoNamespace.initialize_pair_arguments.decode
      );
      const res = c.initialize_pair(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.empty_object.encode);
      break;
    }

    case 0x070659cd: {
      const args = Protobuf.decode<ProtoNamespace.add_liquidity_arguments>(
        contractArgs.args,
        ProtoNamespace.add_liquidity_arguments.decode
      );
      const res = c.add_liquidity(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.add_liquidity_result.encode);
      break;
    }

    case 0x26c78db1: {
      const args = Protobuf.decode<ProtoNamespace.remove_liquidity_arguments>(
        contractArgs.args,
        ProtoNamespace.remove_liquidity_arguments.decode
      );
      const res = c.remove_liquidity(args);
      retbuf = Protobuf.encode(
        res,
        ProtoNamespace.remove_liquidity_result.encode
      );
      break;
    }

    case 0x8b35a506: {
      const args = Protobuf.decode<ProtoNamespace.swap_tokens_in_arguments>(
        contractArgs.args,
        ProtoNamespace.swap_tokens_in_arguments.decode
      );
      const res = c.swap_tokens_in(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.empty_object.encode);
      break;
    }

    case 0xe02d8fbd: {
      const args = Protobuf.decode<ProtoNamespace.swap_tokens_out_arguments>(
        contractArgs.args,
        ProtoNamespace.swap_tokens_out_arguments.decode
      );
      const res = c.swap_tokens_out(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.empty_object.encode);
      break;
    }

    case 0x3f98e58d: {
      const args = Protobuf.decode<ProtoNamespace.get_quote_arguments>(
        contractArgs.args,
        ProtoNamespace.get_quote_arguments.decode
      );
      const res = c.get_quote(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.uint64.encode);
      break;
    }

    case 0x2184ef25: {
      const args = Protobuf.decode<ProtoNamespace.get_amount_out_arguments>(
        contractArgs.args,
        ProtoNamespace.get_amount_out_arguments.decode
      );
      const res = c.get_amount_out(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.uint64.encode);
      break;
    }

    case 0x45378fcb: {
      const args = Protobuf.decode<ProtoNamespace.get_amount_in_arguments>(
        contractArgs.args,
        ProtoNamespace.get_amount_in_arguments.decode
      );
      const res = c.get_amount_in(args);
      retbuf = Protobuf.encode(res, ProtoNamespace.uint64.encode);
      break;
    }

    default:
      System.exit(1);
      break;
  }

  System.exit(0, retbuf);
  return 0;
}

main();
