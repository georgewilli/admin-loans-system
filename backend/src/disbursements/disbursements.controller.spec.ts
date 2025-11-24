import { Test, TestingModule } from '@nestjs/testing';
import { DisbursementsController } from './disbursements.controller';
import { DisbursementsService } from './disbursements.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('DisbursementsController', () => {
  let controller: DisbursementsController;

  const mockDisbursementsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    disburseLoan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisbursementsController],
      providers: [
        {
          provide: DisbursementsService,
          useValue: mockDisbursementsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DisbursementsController>(DisbursementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
