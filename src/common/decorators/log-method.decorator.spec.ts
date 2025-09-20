import {
  LogBusinessOperation,
  LogMethod,
  LogDbOperation,
} from './log-method.decorator';

describe('LogMethod family', () => {
  let logger: { log: jest.Mock; debug: jest.Mock; error: jest.Mock };
  const onError = jest.fn();

  class Sample {
    logger = logger;

    @LogBusinessOperation('sample.work')
    async work(value: number) {
      return value * 2;
    }

    @LogMethod({ operation: 'sample.fail', onError, logArgs: true })
    async fail() {
      throw new Error('fail');
    }

    @LogDbOperation('products')
    async db(id: string) {
      return id;
    }
  }

  let service: Sample;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };
    service = new Sample();
    service.logger = logger;
    jest.clearAllMocks();
    onError.mockClear();
  });

  it('logs lifecycle for business operations', async () => {
    await expect(service.work(2)).resolves.toBe(4);
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Starting sample.work'),
      expect.any(Object),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Completed sample.work'),
      expect.any(Object),
    );
  });

  it('logs failures and triggers onError handler', async () => {
    await expect(service.fail()).rejects.toThrow('fail');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed sample.fail'),
      expect.any(Object),
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'fail', []);
  });

  it('logs db operations with debug level', async () => {
    await service.db('id-1');
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Starting db.products'),
      expect.any(Object),
    );
  });
});
