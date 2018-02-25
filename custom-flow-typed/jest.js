// Reason for this file : https://github.com/flowtype/flow-typed/issues/482
declare function describe(suiteMessage: string, suite: () => void): void;
declare function xdescribe(suiteMessage: string, suite: () => void): void;
declare function it(
  testMessage: string,
  test: () => void | Promise<void>
): void;
declare function fit(testMessage: string, test: () => Promise<void>): void;
declare function pit(testMessage: string, test: () => Promise<void>): void;
declare function xit(
  testMessage: string,
  test: () => void | Promise<void>
): void;
declare function beforeEach(callback: (done: () => void) => any): void;
declare function afterEach(callback: () => void): void;
