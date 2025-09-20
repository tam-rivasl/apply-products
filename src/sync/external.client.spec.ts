import axios from 'axios';
import { ContentfulClient } from './external.client';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContentfulClient', () => {
  const baseOptions = {
    spaceId: 'space',
    accessToken: 'token',
    environment: 'env',
    contentType: 'product',
    timeoutMs: 500,
    retries: 2,
  };

  const setupHttp = (getImpl: jest.Mock) => {
    mockedAxios.create.mockReturnValue({ get: getImpl } as any);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds axios instance with authorization header and queries Contentful entries', async () => {
    const get = jest.fn().mockResolvedValue({ data: { items: [], total: 0 } });
    setupHttp(get);

    const client = new ContentfulClient(baseOptions);
    await client.listProducts({
      limit: 10,
      skip: 5,
      updatedAtGte: '2025-09-18T00:00:00.000Z',
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://cdn.contentful.com/spaces/space/environments/env',
        timeout: 500,
        headers: { Authorization: 'Bearer token' },
      }),
    );
    expect(get).toHaveBeenCalledWith('/entries', {
      params: {
        content_type: 'product',
        limit: 10,
        skip: 5,
        order: 'sys.updatedAt',
        'sys.updatedAt[gte]': '2025-09-18T00:00:00.000Z',
      },
    });
  });

  it('retries on retriable errors respecting retry window', async () => {
    jest.useFakeTimers();
    const error: any = { response: { status: 500 } };
    const get = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ data: { items: [], total: 0 } });
    setupHttp(get);

    const client = new ContentfulClient(baseOptions);
    const promise = client.listProducts({ limit: 1, skip: 0 });

    await jest.runOnlyPendingTimersAsync();
    await expect(promise).resolves.toEqual({ items: [], total: 0 });
    expect(get).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
