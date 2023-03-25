import { Periphery } from '../Periphery';
import { periphery } from '../proto/periphery';

describe('contract', () => {
  it("should return 'hello, NAME!'", () => {
    const c = new Periphery();

    const args = new periphery.hello_arguments('World');
    const res = c.hello(args);

    expect(res.value).toStrictEqual('Hello, World!');
  });
});
