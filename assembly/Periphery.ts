import { System } from "@koinos/sdk-as";
import { periphery } from "./proto/periphery";

export class Periphery {
  hello(args: periphery.hello_arguments): periphery.hello_result {
    const name = args.name!;

    const res = new periphery.hello_result();
    res.value = `Hello, ${name}!`;

    System.log(res.value!);

    return res;
  }
}
