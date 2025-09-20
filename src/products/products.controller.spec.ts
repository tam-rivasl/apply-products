import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(ProductsController);
    jest.clearAllMocks();
  });

  it('delegates to ProductsService.findAll with query filters', async () => {
    const filters = { limit: 3, name: 'abc' } as FindProductsQueryDto;
    const payload = { data: [], limit: 3, offset: 0, total: 0 };
    service.findAll.mockResolvedValue(payload);

    await expect(controller.findAll(filters)).resolves.toBe(payload);
    expect(service.findAll).toHaveBeenCalledWith(filters);
  });

  it('delegates product creation', async () => {
    const dto = { contentfulId: 'c-1', name: 'Mouse' } as CreateProductDto;
    service.create.mockResolvedValue({ id: 'p-1', ...dto });

    await expect(controller.create(dto)).resolves.toEqual({ id: 'p-1', ...dto });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates updates and returns the patched product', async () => {
    const dto = { price: 12 } as UpdateProductDto;
    const updated = { id: 'p-2', price: 12 };
    service.update.mockResolvedValue(updated);

    await expect(controller.update('p-2', dto)).resolves.toBe(updated);
    expect(service.update).toHaveBeenCalledWith('p-2', dto);
  });

  it('delegates removal', async () => {
    const removed = { id: 'p-3', deleted: true };
    service.remove.mockResolvedValue(removed);

    await expect(controller.remove('p-3')).resolves.toBe(removed);
    expect(service.remove).toHaveBeenCalledWith('p-3');
  });
});
