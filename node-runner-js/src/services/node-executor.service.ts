import { Injectable } from '@nestjs/common';
import { Node } from '@n8n-work/contracts';
import * as ivm from 'isolated-vm';

@Injectable()
export class NodeExecutorService {
  async execute(node: Node): Promise<any> {
    console.log(`Executing node: ${node.id} (${node.type})`);

    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();

    const jail = context.global;
    await jail.set('global', jail.derefInto());

    const code = node.data.code || 'return { success: true, data: { message: "No code provided" } };';

    const script = await isolate.compileScript(`new Promise(async (resolve) => {
      try {
        const result = (function() { ${code} })();
        resolve(result);
      } catch (e) {
        resolve({ success: false, error: e.message });
      }
    });`);

    const result = await script.run(context, { promise: true });

    return result;
  }
}
