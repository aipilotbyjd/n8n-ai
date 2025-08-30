import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionEngineService } from "./execution-engine.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Execution } from "./entities/execution-engine.entity";

describe("ExecutionEngineService", () => {
  let service: ExecutionEngineService;
  let executionRepository: any;

  beforeEach(async () => {
    executionRepository = {
      // Mock methods used by ExecutionEngineService
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      // Add other methods as needed
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionEngineService,
        {
          provide: getRepositoryToken(Execution),
          useValue: executionRepository,
        },
      ],
    }).compile();

    service = module.get<ExecutionEngineService>(ExecutionEngineService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
