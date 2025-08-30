import { Injectable } from '@nestjs/common';
import { Node } from '@n8n-work/contracts';
import * as ivm from 'isolated-vm';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NodeExecutorService {
  private readonly builtInNodes: Map<string, string> = new Map();

  constructor() {
    this.loadBuiltInNodes();
  }

  private loadBuiltInNodes() {
    const nodesDir = path.join(__dirname, '..', 'nodes');
    fs.readdirSync(nodesDir).forEach((file) => {
      if (file.endsWith('.js')) {
        const nodeType = path.basename(file, '.js');
        const nodeCode = fs.readFileSync(path.join(nodesDir, file), 'utf-8');
        this.builtInNodes.set(nodeType, nodeCode);
      }
    });
  }

  async execute(node: Node, input: any): Promise<any> {
    console.log(`Executing node: ${node.id} (${node.type})`);

    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();

    const jail = context.global;
    await jail.set('global', jail.derefInto());
    await jail.set('input', new ivm.ExternalCopy(input).copyInto());

    jail.setSync('axios', new ivm.Callback(async (config) => {
      try {
        const response = await axios(config);
        return new ivm.ExternalCopy({ data: response.data, status: response.status }).copyInto();
      } catch (error) {
        return new ivm.ExternalCopy({ error: error.message }).copyInto();
      }
    }));

    let code = node.data.code;
    if (this.builtInNodes.has(node.type)) {
      code = this.builtInNodes.get(node.type);
    }

    if (!code) {
      return { success: false, error: 'No code to execute' };
    }

    const script = await isolate.compileScript(`new Promise(async (resolve) => {
      try {
        const result = await (async function() { 
          const node = ${JSON.stringify(node)};
          const codeFunction = ${code};
          return await codeFunction(input, node);
        })();
        resolve(result);
      } catch (e) {
        resolve({ success: false, error: e.message });
      }
    });`);

    const result = await script.run(context, { promise: true });

    return result;
  }
}
