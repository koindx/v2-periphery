import { StringBytes, System } from "@koinos/sdk-as";
import { Periphery } from '../Periphery';
import { periphery } from '../proto/periphery';

describe('contract', () => {
  it("should return 'hello, NAME!'", () => {
    let r = StringBytes.stringToBytes("ad16154849f8303a937ee2f6b998498aab39bb50fbb8e4c8a2fcc1b6808f7c66")
    System.log(r.toString())

    
  });
});
