import { IntervalTicker } from './interval-ticker';

describe('IntervalTicker', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('calls onTick once per interval', () => {
    const onTick = jasmine.createSpy('onTick');
    new IntervalTicker().start(onTick, 1000);

    jasmine.clock().tick(999);
    expect(onTick).not.toHaveBeenCalled();
    jasmine.clock().tick(1);
    expect(onTick).toHaveBeenCalledTimes(1);
    jasmine.clock().tick(2000);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('stops ticking after stop() (CA-12)', () => {
    const onTick = jasmine.createSpy('onTick');
    const stop = new IntervalTicker().start(onTick, 1000);

    jasmine.clock().tick(1000);
    stop();
    jasmine.clock().tick(5000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('stop() is idempotent', () => {
    const stop = new IntervalTicker().start(() => undefined, 1000);
    expect(() => {
      stop();
      stop();
    }).not.toThrow();
  });

  it('keeps independent timers for each start() (stateless)', () => {
    const ticker = new IntervalTicker();
    const a = jasmine.createSpy('a');
    const b = jasmine.createSpy('b');
    const stopA = ticker.start(a, 1000);
    ticker.start(b, 1000);

    stopA();
    jasmine.clock().tick(3000);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(3);
  });
});
