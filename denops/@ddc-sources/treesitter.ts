import { Denops, fn } from "https://deno.land/x/ddc_vim@v0.17.0/deps.ts#^";
import {
  BaseSource,
  Candidate,
} from "https://deno.land/x/ddc_vim@v0.17.0/types.ts#^";
import {
  GatherCandidatesArguments,
  OnInitArguments,
} from "https://deno.land/x/ddc_vim@v0.17.0/base/source.ts#^";

interface NodeInfo {
  word: string;
  kind: string;
  parent?: string;
  grandparent?: string;
}

type Params = Record<string, unknown>;

export class Source extends BaseSource<Params> {
  private available = false;

  async onInit({ denops }: OnInitArguments<Params>): Promise<void> {
    if (!(await fn.has(denops, "nvim-0.5"))) {
      await this.print_error(denops, "This source needs Neovim >=0.5.0");
      return;
    }
    this.available = true;
  }

  async gatherCandidates({
    denops,
  }: GatherCandidatesArguments<Params>): Promise<Candidate[]> {
    if (!this.available) {
      return [];
    }
    const nodeInfos = (await denops.call(
      "luaeval",
      "require'ddc-treesitter'.gather_candidates()",
    )) as NodeInfo[];
    return nodeInfos.map(({ word, kind, parent, grandparent }) => {
      const candidate: Candidate = { word, kind };
      if (grandparent) {
        candidate.menu = `→ ${grandparent}`;
      } else if (parent) {
        candidate.menu = `→ ${parent}`;
      }
      return candidate;
    });
  }

  params(): Params {
    return {};
  }

  private async print_error(denops: Denops, message: string): Promise<void> {
    await denops.call("ddc#util#print_error", message, "ddc-treesitter");
  }
}
