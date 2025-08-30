import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionEngineController } from "./execution-engine.controller";
import { ExecutionEngineService } from "./execution-engine.service";

describe("ExecutionEngineController", () => {
  let controller: ExecutionEngineController;
  let executionEngineService: any;

  beforeEach(async () => {
    executionEngineService = {
      // Mock methods used by ExecutionEngineController
      // Example: startExecution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionEngineController],
      providers: [
        {
          provide: ExecutionEngineService,
          useValue: executionEngineService,
        },
      ],
    }).compile();

    controller = module.get<ExecutionEngineController>(ExecutionEngineController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
