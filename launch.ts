#!/usr/bin/env -S deno run -A

import {
  BufWriterSync,
  readLines,
} from "https://deno.land/std@0.168.0/io/mod.ts";
import { dirname } from "https://deno.land/std@0.168.0/path/mod.ts";
export * as colors from "https://deno.land/std@0.168.0/fmt/colors.ts";

export function rm(path: string, recursive = false) {
  try {
    Deno.removeSync(path, { recursive });
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
}

export function wipeData() {
  const NAME = ".polkadot-testing";
  try {
    Deno.lstatSync(NAME);
  } catch {
    throw new Error(`Create "${NAME}" file in ${Deno.cwd()}`);
  }
  rm("data", true);
}

export class Log {
  path: string;
  file: Deno.FsFile;
  buf: BufWriterSync;
  timer: number;
  utf8 = new TextEncoder();

  constructor(public name: string, flush = 3000) {
    this.path = `data/log/${name}.log`;
    Deno.mkdirSync(dirname(this.path), { recursive: true });
    this.file = Deno.openSync(this.path, {
      create: true,
      write: true,
      append: true,
    });
    this.buf = new BufWriterSync(this.file);
    this.timer = setInterval(() => this.buf.flush(), flush);
    this.buf.writeSync(this.utf8.encode("\n"));
  }

  write(s: string, eol = true) {
    if (eol) s += "\n";
    this.buf.writeSync(this.utf8.encode(s));
  }

  flush() {
    this.buf.flush();
  }
}

export async function logFrom(
  process: Deno.Process,
  log: Log,
  cb?: (s: string) => void,
) {
  await Promise.all([process.stdout, process.stderr].map(async (reader) => {
    if (!reader) return;
    for await (const line of readLines(reader)) {
      log.write(line);
      cb?.(line);
    }
    log.flush();
  }));
}

export type Color = (s: string) => string;

export class Peer {
  args: string[];
  port: number;
  maddr: string;
  http: string;
  ws: string;
  metrics: string;

  constructor(public i: number, public seed: string, public peer: string) {
    if (!/^[0-9a-f]{64}$/.test(seed)) throw new Error();
    if (
      !/^12D3KooW[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{44}$/
        .test(peer)
    ) throw new Error();
    const port0 = 10000 + i * 10;
    const port = port0;
    const http = port0 + 1;
    const ws = port0 + 2;
    const metrics = port0 + 3;
    const maddr = `/ip4/127.0.0.1/tcp/${port}`;
    this.port = port;
    this.maddr = `${maddr}/p2p/${this.peer}`;
    this.http = `http://127.0.0.1:${http}`;
    this.ws = `ws://127.0.0.1:${ws}`;
    this.metrics = `http://127.0.0.1:${metrics}/metrics`;
    this.args = [
      ...["--node-key", this.seed],
      ...["--listen-addr", maddr],
      ...["--rpc-port", `${http}`],
      ...["--ws-port", `${ws}`],
      ...["--prometheus-port", `${metrics}`],
    ];
  }

  static get(peer: number | Peer) {
    if (peer instanceof Peer) return peer;
    if (!Number.isInteger(peer)) throw new Error();
    if (peer < 0) throw new Error();
    if (peer >= peers.length) throw new Error(`TODO: peer ${peer}`);
    return peers[peer];
  }
}

// deno-fmt-ignore
const peers = [
  new Peer(0, "f8dfdb0f1103d9fb2905204ac32529d5f148761c4321b2865b0a40e15be75f57", "12D3KooWT3CsfuervgduMG6RdjVq66z9JnN1GcsRBCWZPxPSBZSV"),
  new Peer(1, "96c891b8726cb18c781aefc082dbafcb827e16c8f18f22d461e83eabd618e780", "12D3KooWNgqk3v24c2Qvi3ZrkJVLayPeUmGbqnNuyt4hHmtxMghk"),
  new Peer(2, "619d5e68139f714ee8e7892ce5afd8fbe7a4172a675fea5c5a06fb94fe3d797d", "12D3KooWCUFF1beahMbdvX1EygEtsfuV2Q3xYcZq2CaEb9khrL3R"),
  new Peer(3, "8d0c5f498a763eaa8c04861cac06289784140b4bbfa814fef898f1f4095de4a3", "12D3KooWBroL5fZojMcNb7XBzoDqB5wXU5SBhzXfvVRzq1s8p26M"),
  new Peer(4, "dd806adee3d12fbfd211e6eecf83012ea9bf2268c9a9e5f84bc3151e2dbe6cba", "12D3KooWS3JSjUSMxh3mrz4mJpw3erTzzwVuTawMbeJtedoCN6p3"),
  new Peer(5, "f39e3ae5ad6a0ee7b60f75323b685f0d12b3ff88d2ecd5ccb6a3b837a08eff95", "12D3KooWP97syC4W7z5RP8RFdGMMCL4VHTf8sFLdUiKzP7wYPWdm"),
  new Peer(6, "1407c951a3b8aa437492fdc6e403daaa4099a5d258a89662e88845db745409dc", "12D3KooWCjDwwzREB6DXihBC2VmcANkVr6ZCohwboUTuoFpdo8e1"),
  new Peer(7, "0ab49b9fc745e44b5269d6111648d011ee31e0ada91abe35e456d301a0868443", "12D3KooWSqgEGMLJ7v8YpyDrJJ7eVWVZ4LCHhuaV596UGzsAyHmW"),
  new Peer(8, "08d9b78f0b392ae784b390ba42a0f6f5692f5930957b7b51248de1306ffd112d", "12D3KooWJZUSjk53WYVLkXWYQTXuJ32Z4V9msQ8DRGsUF9atpoYz"),
  new Peer(9, "38c6daaf32efb4c121f4b39c80dee603558dff35ae2010add9620553811e1b54", "12D3KooWRWnHLFWrzA7wjKmTnHHVpSYAkp9Q15efGVcohbWrAWSr"),
  new Peer(10, "15632910ec86fa26cf37787b54590fc20ac4e5a4964a775c41b9af4f543f650c", "12D3KooWDWevioVb379bW3ryzngXxwQeDZabKqShT9WJVseKgVDh"),
  new Peer(11, "33fa75cbd434e8f496a248f547d353795c731c2ff7c4745d74f4cf7749971968", "12D3KooWRxsmBJ1VKL2vMfY9PAnyhDmamCP1owt6cRJ2ZyS7ARBd"),
  new Peer(12, "ad533d45193603ae0c8cf54cffe4df43be1723a977d975653580f9825c870fbc", "12D3KooWMy5dgd1rdq7jP2sPSXReDrPjNUz1mMtFP2tHtGtcs9ce"),
  new Peer(13, "cd0d90a263226a34cacad89fa4c141c2ad85e113a8ebb7feb2298407d2e267c9", "12D3KooWGRWyDPPPhXvGVAi19SCZoaYTVatb4zfRearmfrMxyshm"),
  new Peer(14, "f2b3f3299facd6e8275b75bfd222375a2c956b9daa9468e836bb0e294c06f24d", "12D3KooWLKdY6H3CArcbzsArmxFhdVzpSBygAu2jKykatxoV2Lac"),
  new Peer(15, "1878de06322c7361f5e43d4decaf4efb162bfc425264ece48beeea3bcdc81e84", "12D3KooWP5LGqV6JuM5VUQ5ZSRaN3y4iXgDr4wEZRAL1jmdUG1E4"),
  new Peer(16, "8a55b109b1cc979f938b2e5382dd3618d07a75f276c7950baf1e6aed76c2fd37", "12D3KooWEWYrByRCEh269TEvH2bAewk2r5DJtSw4PNChC3YVk2TZ"),
  new Peer(17, "f7f3815252e12ce2d65be1c70ad17dcd28f9561f4466fa87e0c22b3a369f35f6", "12D3KooWQvAnhysXEUE8rvqMu6nq6MGcyf6GZLU8PcgPRK7nVRg1"),
  new Peer(18, "72cf61b8f1da4b826b5553291fdb385e30dd24461c4be101a32e8c7e29892d78", "12D3KooWHeA1owT5ZwqtrLzD8JJKcpHbZJ24HKHuanyXBN4i6uQn"),
  new Peer(19, "452523963748952cae8b85159fc77d17a51f5675290f812a10780d370c18feac", "12D3KooWPX6YEj7f8bWYPWLDgK7YUk3H39ZydANgTwevY8kFakEJ"),
];

const DEV = {
  a: "alice",
  b: "bob",
  c: "charlie",
  d: "dave",
  e: "eve",
  f: "ferdie",
};

export type Who = keyof typeof DEV;

export type Opt = [
  Who,
  number | Peer,
  { kagome?: boolean; para?: [number, number | Peer] },
];

export class Launch {
  name: string;

  constructor(
    public who: Who,
    public peer: Peer,
    public kagome: boolean,
    public para: [number, Peer],
  ) {
    if (!DEV[who]) throw new Error();
    if (kagome && para) throw new Error();
    if (peer.i === para?.[1]?.i) throw new Error();

    this.name = this.who;
    if (this.para) this.name += `-${this.para[0]}`;
  }

  static parse(s: string): Launch {
    const RE =
      /^(?:(?<who>[a-f])@(?<peer>\d{1,2}))(?:\+(?:(?<kagome>k)|(?<para>\d)@(?<peer2>\d{1,2})))?$/;
    const g = s.match(RE)?.groups!;
    return g && new Launch(
      g.who! as Who,
      Peer.get(+g.peer),
      !!g.kagome,
      g.para ? [+g.para, Peer.get(+g.peer2)] : null!,
    );
  }

  static opt(o: Opt): Launch {
    const p = o[2].para;
    return new Launch(
      o[0],
      Peer.get(o[1]),
      !!o[2].kagome,
      p ? [p[0], Peer.get(p[1])] : null!,
    );
  }

  _args: string[] = [];
  args(args: string[]) {
    if (args.includes("--")) throw new Error("TODO: para args");
    this._args = args;
    return this;
  }

  get cmd() {
    let cmd: string[];
    const chain = ["--chain", "chain/relay.json"];
    const dev = `--${DEV[this.who]}`;
    const base = ["--base-path", `data/${this.name}`];
    const extra = ["--no-hardware-benchmarks", "--no-mdns"];
    if (this.para) {
      cmd = [
        `bin/para-${this.para[0]}`,
        dev,
        "--collator",
        "--force-authoring",
        ...base,
        ...["--chain", `chain/para-${this.para[0]}.json`],
        ...this.para[1].args,
        ...extra,
        "--",
        ...chain,
        ...this.peer.args,
        ...extra,
      ];
    } else {
      cmd = [
        this.kagome ? "bin/kagome" : "bin/polkadot",
        dev,
        "--validator",
        ...base,
        ...chain,
        ...this.peer.args,
      ];
      if (!this.kagome) cmd.push(...extra);
    }
    cmd.push(...this._args);
    return cmd;
  }

  _log: Log = null!;
  get log() {
    if (!this._log) this._log = new Log(this.name);
    return this._log;
  }

  _prefix = "";
  color(color: Color) {
    this._prefix = `${color(this.name)}: `;
    return this;
  }

  async run() {
    const { cmd } = this;
    this.log.write(JSON.stringify(cmd));
    console.info(this._prefix + JSON.stringify(cmd));
    const process = Deno.run({ cmd, stdout: "piped", stderr: "piped" });
    const [status] = await Promise.all([
      process.status(),
      logFrom(
        process,
        this.log,
        (s) => console.info(this._prefix + s),
      ),
    ]);
    if (!status.success) throw new Error(JSON.stringify(status));
  }
}

export async function launch(color: Color, arg: string | Opt) {
  const launch = typeof arg === "string" ? Launch.parse(arg) : Launch.opt(arg);
  launch.color(color);
  await launch.run();
}

async function main() {
  function help() {
    console.info([
      `usage:`,
      `  @0`,
      `    print peer 0 info`,
      `  a@0 [RELAY...]`,
      `    run: bin/polkadot --alice [PEER 0] chain/relay.json [RELAY...]`,
      `  a@0+2@1 [PARA...] -- [RELAY...]`,
      `    run: bin/para-2 --alice [PEER 1] chain/para-2.json [PARA...] -- [PEER 0] chain/relay.json [RELAY...]`,
    ].join("\n"));
  }
  const args = Deno.args.slice();
  if (!args.length) return help();

  if (args[0].startsWith("@")) {
    for (const arg of args) {
      const m = arg.match(/^@(\d{1,2})$/);
      if (!m) return help();
      const peer = Peer.get(+m[1]);
      console.info(peer.maddr);
      console.info(peer.metrics);
      console.info(`https://polkadot.js.org/apps/?rpc=${peer.ws}`);
    }
    return;
  }

  const launch = Launch.parse(args[0]);
  args.shift();
  launch.args(args);
  await launch.run();
}
if (import.meta.main) {
  await main();
}
