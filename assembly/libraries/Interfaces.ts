export class Amounts {
  amountA: u64;
  amountB: u64;
  constructor(_amountA: u64, _amountB: u64) {
    this.amountA = _amountA;
    this.amountB = _amountB;
  }
}

export class Reserves {
  reserveA: u64;
  reserveB: u64;
  constructor(_amountA: u64, _amountB: u64) {
    this.reserveA = _amountA;
    this.reserveB = _amountB;
  }
}


export class Swaps {
  amounts: u64[]
  address: Uint8Array[]
  constructor(_amounts: u64[], _address: Uint8Array[]) {
    this.amounts = _amounts;
    this.address = _address;
  }
}