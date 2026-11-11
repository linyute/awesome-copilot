/*!
 * webmcpify 耐久性異動日誌輔助程式
 *
 * MIT License
 * Copyright (c) 2026 Jonas Tüchler
 *
 * 特此免費授予任何取得本軟體及相關說明文件檔案（「軟體」）副本之人，
 * 在不受限制的情況下處理本軟體，包括但不限於使用、複製、修改、合併、發布、
 * 散布、再授權及/或販售本軟體之副本的權利，並允許獲得本軟體之人遵循下列條件：
 *
 * 上述著作權聲明及本授權聲明應包含於本軟體之所有副本或重要部分中。
 *
 * 本軟體係「依現狀」提供，不提供任何明示或默示之保證，包括但不限於
 * 適銷性、特定目的之適用性及不侵權之保證。在任何情況下，作者或著作權持有人
 * 均不對因本軟體或本軟體之使用或其他交易而產生或與之相關的任何合約、
 * 侵權或其他訴訟中的任何索賠、損害或其他責任負責。
 */
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readFile, realpath, rename, rm, stat, type FileHandle } from 'node:fs/promises';
import { hostname } from 'node:os';
import { basename, dirname, join } from 'node:path';

type JsonObject = Record<string, unknown>;

export interface MutationExecution {
  executionId: string;
  tool: string;
  contractRevision: number;
  origin: string;
  role: string;
  fixtureRevision: string;
  argumentsFingerprint: string;
  startedAt: string;
  state: 'started' | 'reconciled';
  evidence: string;
  parentExecutionId?: string;
  outcome?: string;
  reconciledAt?: string;
}

export interface BeforeDispatchInput {
  /** 正被派送的工具/動作。 */
  tool: string;
  /** 擁有日誌的資訊清單工具；預設為 `tool`。 */
  manifestTool?: string;
  contractRevision: number;
  origin: string;
  role: string;
  fixtureRevision: string;
  arguments: unknown;
  evidence: string;
  /** 僅針對此未確認之父執行的清理動作進行設定。 */
  parentExecutionId?: string;
}

export interface SettlementInput {
  outcome: string;
  evidence: string;
  reconciledAt?: string;
}

export interface OpenMutationJournalOptions {
  manifestPath: string;
  /** 選用的有界取得時間；若省略則表示持續等候直到取得擁有權。 */
  timeoutMs?: number;
}

interface ManifestTool extends JsonObject {
  id?: string;
  status?: string;
  verifiedAgainst?: unknown;
  mutationExecutions?: MutationExecution[];
}

interface Manifest extends JsonObject {
  mutationLockIdentity?: string;
  tools: ManifestTool[];
}

interface LockCandidate {
  command: string;
  args(): string[];
  probeArgs(): string[];
  busyExitCode: number;
}

interface LockIdentity {
  dev: number;
  ino: number;
}

const LOCK_CANDIDATES: LockCandidate[] = [
  {
    command: 'flock',
    // fd 3 繼承自已驗證的父代控制代碼。這可防止
    // 在驗證與諮詢鎖定 (advisory-lock) 取得之間的路徑抽換。flock 的
    // 描述元鎖定屬於共享開啟檔案說明，因此在簡短的取得子行程結束後，
    // 仍會由該執行程式持續持有。
    args: () => ['--exclusive', '3'],
    probeArgs: () => ['--exclusive', '--nonblock', '3'],
    busyExitCode: 1,
  },
  {
    command: 'lockf',
    // macOS/FreeBSD lockf 的描述元形式使用 BSD flock(2) 鎖定並
    // 隱含 -k，因此它既不透過路徑開啟，也不會移除 sidecar。
    args: () => ['-s', '3'],
    probeArgs: () => ['-s', '-t', '0', '3'],
    busyExitCode: 75,
  },
];

function requireText(value: string, label: string): string {
  if (!value.trim()) throw new Error(`${label} 必須為非空白字串`);
  return value;
}

function canonicalJson(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error('異動引數必須為可 JSON 序列化的內容');
  const parsed = JSON.parse(json) as unknown;
  const serialize = (item: unknown): string => {
    if (Array.isArray(item)) return `[${item.map(serialize).join(',')}]`;
    if (item && typeof item === 'object') {
      return `{${Object.keys(item as JsonObject)
        .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
        .map((key) => `${JSON.stringify(key)}:${serialize((item as JsonObject)[key])}`)
        .join(',')}}`;
    }
    return JSON.stringify(item);
  };
  return serialize(parsed);
}

export function fingerprintArguments(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

type OwnedStep = <T>(operation: () => Promise<T>) => Promise<T>;

async function syncDirectory(path: string, step: OwnedStep): Promise<void> {
  const handle = await step(() => open(path, 'r'));
  try {
    await step(() => handle.sync());
  } finally {
    await handle.close();
  }
}

async function durableReplace(manifestPath: string, manifest: Manifest, step: OwnedStep): Promise<void> {
  const directory = dirname(manifestPath);
  const temporary = join(directory, `.${basename(manifestPath)}.${process.pid}.${randomUUID()}.tmp`);
  const mode = (await step(() => stat(manifestPath))).mode & 0o777;
  let handle;
  try {
    handle = await step(() => open(temporary, 'wx', mode));
    await step(() => handle!.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'));
    await step(() => handle!.sync());
    await step(() => handle!.close());
    handle = undefined;
    await step(() => rename(temporary, manifestPath));
    await syncDirectory(directory, step);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function readManifest(manifestPath: string): Promise<Manifest> {
  const value = JSON.parse(await readFile(manifestPath, 'utf8')) as Partial<Manifest>;
  if (!Array.isArray(value.tools)) throw new Error(`資訊清單沒有 tools 陣列: ${manifestPath}`);
  return value as Manifest;
}

function unresolvedEntries(manifest: Manifest): MutationExecution[] {
  validateJournals(manifest);
  return manifest.tools.flatMap((tool) => tool.mutationExecutions!
    .filter((entry) => entry.state === 'started'));
}

function validateJournals(manifest: Manifest): void {
  const toolIds = new Set<string>();
  const executions = new Map<string, { entry: MutationExecution; owner: ManifestTool }>();
  for (const [toolIndex, tool] of manifest.tools.entries()) {
    if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
    throw new Error(`資訊清單工具 ${toolIndex} 必須為物件`);
    }
    const toolId = requireText(typeof tool.id === 'string' ? tool.id : '', `manifest tool ${toolIndex} id`);
    if (toolIds.has(toolId)) throw new Error(`重複的資訊清單工具識別碼: ${toolId}`);
    toolIds.add(toolId);
    if (!Array.isArray(tool.mutationExecutions)) {
    throw new Error(`資訊清單工具的 mutationExecutions 必須為陣列: ${toolId}`);
    }
    for (const [entryIndex, candidate] of tool.mutationExecutions.entries()) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error(`異動執行 ${toolId}[${entryIndex}] 必須為物件`);
      }
      const entry = candidate as MutationExecution;
      const label = `mutation execution ${toolId}[${entryIndex}]`;
      requireText(typeof entry.executionId === 'string' ? entry.executionId : '', `${label} executionId`);
      requireText(typeof entry.tool === 'string' ? entry.tool : '', `${label} tool`);
      if (!Number.isInteger(entry.contractRevision) || entry.contractRevision < 1) {
      throw new Error(`${label} contractRevision 必須為正整數`);
      }
      for (const field of ['origin', 'role', 'fixtureRevision', 'argumentsFingerprint', 'startedAt', 'evidence'] as const) {
        requireText(typeof entry[field] === 'string' ? entry[field] : '', `${label} ${field}`);
      }
      if (entry.state !== 'started' && entry.state !== 'reconciled') {
      throw new Error(`${label} 具有未知狀態: ${String(entry.state)}`);
      }
      if (entry.parentExecutionId !== undefined) {
        requireText(typeof entry.parentExecutionId === 'string' ? entry.parentExecutionId : '', `${label} parentExecutionId`);
      }
      if (entry.state === 'reconciled') {
        requireText(typeof entry.outcome === 'string' ? entry.outcome : '', `${label} outcome`);
        requireText(typeof entry.reconciledAt === 'string' ? entry.reconciledAt : '', `${label} reconciledAt`);
      }
      if (executions.has(entry.executionId)) {
      throw new Error(`重複的異動 executionId: ${entry.executionId}`);
      }
      executions.set(entry.executionId, { entry, owner: tool });
    }
  }
  for (const { entry, owner } of executions.values()) {
    if (!entry.parentExecutionId) continue;
    const parent = executions.get(entry.parentExecutionId);
    if (!parent || parent.owner !== owner || parent.entry.parentExecutionId) {
      throw new Error(`異動執行的 parentExecutionId 無效: ${entry.executionId}`);
    }
  }
}

async function migrateManifest(
  manifestPath: string,
  manifest: Manifest,
  lockIdentity: string,
  step: OwnedStep,
): Promise<Manifest> {
  let changed = false;
  if (!Object.hasOwn(manifest, 'mutationLockIdentity')) {
    manifest.mutationLockIdentity = lockIdentity;
    changed = true;
  } else if (manifest.mutationLockIdentity !== lockIdentity) {
  throw new Error('資訊清單 mutationLockIdentity 與鎖定的 sidecar 不符');
  }
  for (const [toolIndex, tool] of manifest.tools.entries()) {
    if (!tool || typeof tool !== 'object' || Array.isArray(tool)) {
    throw new Error(`資訊清單工具 ${toolIndex} 必須為物件`);
    }
    if (!Object.hasOwn(tool, 'mutationExecutions')) {
      tool.mutationExecutions = [];
      tool.verifiedAgainst = null;
      if (tool.status === 'verified') tool.status = 'integrated';
      changed = true;
    }
  }
  validateJournals(manifest);
  if (changed) await durableReplace(manifestPath, manifest, step);
  return manifest;
}

async function writeOwnerMetadata(handle: FileHandle, metadata: JsonObject, step: OwnedStep): Promise<void> {
  const serialized = `${JSON.stringify(metadata)}\n`;
  await step(() => handle.truncate(0));
  await step(() => handle.write(serialized, 0, 'utf8').then(() => undefined));
  await step(() => handle.sync());
}

async function readOwnerMetadata(handle: FileHandle, step: OwnedStep): Promise<JsonObject> {
  const size = (await step(() => handle.stat())).size;
  if (size === 0) return {};
  const buffer = Buffer.alloc(size);
  const { bytesRead } = await step(() => handle.read(buffer, 0, size, 0));
  let value: unknown;
  try {
    value = JSON.parse(buffer.subarray(0, bytesRead).toString('utf8'));
  } catch {
  throw new Error('manifest.lock 包含格式錯誤的擁有者中繼資料');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
  throw new Error('manifest.lock 擁有者中繼資料必須為物件');
  }
  return value as JsonObject;
}

async function openLockFile(lockPath: string): Promise<{ handle: FileHandle; identity: LockIdentity }> {
  const handle = await open(lockPath, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.nlink !== 1) {
  throw new Error('manifest.lock 必須為僅有一個連結的一般檔案');
    }
    const pathInfo = await lstat(lockPath);
    if (!pathInfo.isFile() || pathInfo.isSymbolicLink() || pathInfo.nlink !== 1
      || pathInfo.dev !== info.dev || pathInfo.ino !== info.ino) {
  throw new Error('manifest.lock 身分識別在開啟時發生變更');
    }
    return { handle, identity: { dev: info.dev, ino: info.ino } };
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}

async function runLockCommand(
  candidate: LockCandidate,
  args: string[],
  lockHandle: FileHandle,
  lockPath: string,
  timeoutMs?: number,
): Promise<{ code: number | null; signal: NodeJS.Signals | null; stderr: string }> {
  const child = spawn(candidate.command, args, {
    detached: true,
    stdio: ['ignore', 'ignore', 'pipe', lockHandle.fd],
  });
  let stderr = '';
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk) => { stderr += chunk; });
  const exit = waitForChildExit(child);
  let timer: NodeJS.Timeout | undefined;
  const timedOut = Symbol('timed-out');
  const result = await (timeoutMs === undefined
    ? exit
    : Promise.race([
      exit,
      new Promise<typeof timedOut>((resolve) => { timer = setTimeout(() => resolve(timedOut), timeoutMs); }),
    ]));
  if (timer) clearTimeout(timer);
  if (result === timedOut) {
    try {
      process.kill(-child.pid!, 'SIGTERM');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
    await exit.catch(() => undefined);
      throw new Error(`等候 ${lockPath} 逾時（${timeoutMs} 毫秒後）`);
  }
  return { ...result, stderr };
}

async function verifyLockHeld(
  candidate: LockCandidate,
  lockPath: string,
  identity: LockIdentity,
): Promise<void> {
  const probe = await openLockFile(lockPath);
  try {
    if (probe.identity.dev !== identity.dev || probe.identity.ino !== identity.ino) {
  throw new Error('manifest.lock 身分識別在取得鎖定後發生變更');
    }
    const result = await runLockCommand(candidate, candidate.probeArgs(), probe.handle, lockPath);
    if (result.code !== candidate.busyExitCode) {
      throw new Error(
        `${candidate.command} 描述元鎖定未能由執行程式持續持有 `
        + `(${result.code ?? result.signal ?? 'unknown'}): ${result.stderr.trim()}`,
      );
    }
  } finally {
    await probe.handle.close().catch(() => undefined);
  }
}

async function acquireLock(
  lockHandle: FileHandle,
  lockPath: string,
  lockIdentity: LockIdentity,
  timeoutMs?: number,
): Promise<LockCandidate> {
  const unavailable: string[] = [];
  for (const candidate of LOCK_CANDIDATES) {
    try {
      const result = await runLockCommand(candidate, candidate.args(), lockHandle, lockPath, timeoutMs);
      if (result.code !== 0) {
        throw new Error(
          `${candidate.command} 在取得鎖定前即結束 `
          + `(${result.code ?? result.signal ?? 'unknown'}): ${result.stderr.trim()}`,
        );
      }
      await verifyLockHeld(candidate, lockPath, lockIdentity);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        unavailable.push(candidate.command);
        continue;
      }
      throw error;
    }
  }
  throw new Error(
    `異動驗證不可用：沒有支援的諮詢鎖定 (advisory-lock) 指令 (${unavailable.join(', ')})`,
  );
}

function waitForChildExit(
  child: ChildProcess,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      child.off('error', onError);
      child.off('exit', onExit);
    };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      resolve({ code, signal });
    };
    child.once('error', onError);
    child.once('exit', onExit);
    if (child.exitCode !== null || child.signalCode !== null) {
      onExit(child.exitCode, child.signalCode);
    }
  });
}

export class MutationJournal {
  readonly manifestPath: string;
  readonly lockPath: string;
  readonly ownerToken: string;
  readonly lockBackend: string;
  #lockHandle: FileHandle | undefined;
  #lockIdentity: LockIdentity;
  #stableLockIdentity = '';
  #closed = false;
  #unresolved: MutationExecution[];

  private constructor(
    manifestPath: string,
    lockPath: string,
    ownerToken: string,
    lockHandle: FileHandle,
    lockIdentity: LockIdentity,
    lockBackend: string,
    unresolved: MutationExecution[],
  ) {
    this.manifestPath = manifestPath;
    this.lockPath = lockPath;
    this.ownerToken = ownerToken;
    this.lockBackend = lockBackend;
    this.#lockHandle = lockHandle;
    this.#lockIdentity = lockIdentity;
    this.#unresolved = unresolved;
  }

  static async open(options: OpenMutationJournalOptions): Promise<MutationJournal> {
    const manifestPath = await realpath(options.manifestPath);
    const manifestDirectory = dirname(manifestPath);
    const lockPath = join(manifestDirectory, 'manifest.lock');
    const { handle: lockHandle, identity: lockIdentity } = await openLockFile(lockPath);
    let journal: MutationJournal | undefined;
    const ownerToken = randomUUID();
    try {
      const candidate = await acquireLock(lockHandle, lockPath, lockIdentity, options.timeoutMs);
      journal = new MutationJournal(
        manifestPath,
        lockPath,
        ownerToken,
        lockHandle,
        lockIdentity,
        candidate.command,
        [],
      );
      const manifest = await journal.#ownedStep(() => readManifest(manifestPath));
      const ownerMetadata = await readOwnerMetadata(lockHandle, journal.#ownedStep);
      const manifestIdentity = manifest.mutationLockIdentity;
      const sidecarIdentity = ownerMetadata.lockIdentity;
      if (manifestIdentity !== undefined && (typeof manifestIdentity !== 'string' || !manifestIdentity.trim())) {
    throw new Error('資訊清單 mutationLockIdentity 必須為非空白字串');
      }
      if (sidecarIdentity !== undefined && (typeof sidecarIdentity !== 'string' || !sidecarIdentity.trim())) {
    throw new Error('manifest.lock lockIdentity 必須為非空白字串');
      }
      if (manifestIdentity && !sidecarIdentity) {
    throw new Error('manifest.lock 失去穩定身分識別；拒絕替換 sidecar');
      }
      if (manifestIdentity && sidecarIdentity && manifestIdentity !== sidecarIdentity) {
    throw new Error('manifest.lock 穩定身分識別與資訊清單不符');
      }
      journal.#stableLockIdentity = manifestIdentity ?? sidecarIdentity as string | undefined ?? randomUUID();
      await writeOwnerMetadata(lockHandle, {
        lockIdentity: journal.#stableLockIdentity,
        ownerToken,
        host: hostname(),
        pid: process.pid,
        lockBackend: candidate.command,
        processStartedAt: new Date(Date.now() - process.uptime() * 1_000).toISOString(),
        acquiredAt: new Date().toISOString(),
      }, journal.#ownedStep);
      const migrated = await migrateManifest(
        manifestPath,
        manifest,
        journal.#stableLockIdentity,
        journal.#ownedStep,
      );
      journal.#unresolved = unresolvedEntries(migrated);
      await journal.#checkOwnership();
      return journal;
    } catch (error) {
      if (journal) await journal.#releaseLock().catch(() => undefined);
      else await lockHandle.close().catch(() => undefined);
      throw error;
    }
  }

  get unresolved(): readonly MutationExecution[] {
    return structuredClone(this.#unresolved);
  }

  async beforeDispatch(input: BeforeDispatchInput): Promise<MutationExecution> {
    await this.#checkOwnership();
    requireText(input.tool, 'tool');
    requireText(input.origin, 'origin');
    requireText(input.role, 'role');
    requireText(input.fixtureRevision, 'fixtureRevision');
    requireText(input.evidence, 'evidence');
    if (!Number.isInteger(input.contractRevision) || input.contractRevision < 1) {
    throw new Error('contractRevision 必須為正整數');
    }

    const manifest = await this.#ownedStep(() => readManifest(this.manifestPath));
    validateJournals(manifest);
    const unresolved = unresolvedEntries(manifest);
    const manifestTool = input.manifestTool ?? input.tool;
    const owner = manifest.tools.find((tool) => tool.id === manifestTool);
    if (!owner || !Array.isArray(owner.mutationExecutions)) {
    throw new Error(`資訊清單工具沒有異動日誌: ${manifestTool}`);
    }
    if (input.parentExecutionId) {
      const parent = unresolved.find((entry) => entry.executionId === input.parentExecutionId);
      const parentOwner = manifest.tools.find((tool) =>
        tool.mutationExecutions?.some((entry) => entry.executionId === input.parentExecutionId),
      );
      const unrelated = unresolved.filter((entry) => entry.executionId !== input.parentExecutionId);
      if (!parent || parentOwner !== owner || unrelated.length > 0) {
      throw new Error('僅允許針對其唯一的未確認父執行進行清理派送');
      }
    } else if (unresolved.length > 0) {
      throw new Error(`異動派送被 ${unresolved.length} 個未確認的執行所阻擋`);
    }

    const execution: MutationExecution = {
      executionId: randomUUID(),
      tool: input.tool,
      contractRevision: input.contractRevision,
      origin: input.origin,
      role: input.role,
      fixtureRevision: input.fixtureRevision,
      argumentsFingerprint: fingerprintArguments(input.arguments),
      startedAt: new Date().toISOString(),
      state: 'started',
      evidence: input.evidence,
      ...(input.parentExecutionId ? { parentExecutionId: input.parentExecutionId } : {}),
    };
    owner.mutationExecutions.push(execution);
    await durableReplace(this.manifestPath, manifest, this.#ownedStep);

    const stored = await this.#ownedStep(() => readManifest(this.manifestPath));
    validateJournals(stored);
    const persisted = stored.tools
      .find((tool) => tool.id === manifestTool)
      ?.mutationExecutions?.find((entry) => entry.executionId === execution.executionId);
    if (!persisted || JSON.stringify(persisted) !== JSON.stringify(execution)) {
    throw new Error(`派送前日誌項目未能持久化儲存: ${execution.executionId}`);
    }
    this.#unresolved = unresolvedEntries(stored);
    await this.#checkOwnership();
    return structuredClone(execution);
  }

  async settle(executionId: string, input: SettlementInput): Promise<MutationExecution> {
    await this.#checkOwnership();
    requireText(executionId, 'executionId');
    requireText(input.outcome, 'outcome');
    requireText(input.evidence, 'evidence');

    const manifest = await this.#ownedStep(() => readManifest(this.manifestPath));
    validateJournals(manifest);
    const owner = manifest.tools.find((tool) =>
      tool.mutationExecutions?.some((entry) => entry.executionId === executionId),
    );
    const execution = owner?.mutationExecutions?.find((entry) => entry.executionId === executionId);
    if (!execution) throw new Error(`找不到異動執行: ${executionId}`);
    if (execution.state !== 'started') throw new Error(`異動執行已經處於 ${execution.state} 狀態: ${executionId}`);
    if (!execution.parentExecutionId) {
      const unresolvedCleanup = owner?.mutationExecutions?.find((entry) =>
        entry.parentExecutionId === executionId && entry.state === 'started',
      );
      if (unresolvedCleanup) {
      throw new Error(`異動執行具有未確認的清理項目: ${unresolvedCleanup.executionId}`);
      }
    }

    execution.state = 'reconciled';
    execution.outcome = input.outcome;
    execution.reconciledAt = input.reconciledAt ?? new Date().toISOString();
    execution.evidence = input.evidence;
    await durableReplace(this.manifestPath, manifest, this.#ownedStep);
    const stored = await this.#ownedStep(() => readManifest(this.manifestPath));
    validateJournals(stored);
    this.#unresolved = unresolvedEntries(stored);
    await this.#checkOwnership();
    return structuredClone(execution);
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    let failure: unknown;
    try {
      if (!failure) {
        await syncDirectory(dirname(this.manifestPath), this.#ownedStep);
        await writeOwnerMetadata(this.#lockHandle!, {
          lockIdentity: this.#stableLockIdentity,
          ownerToken: this.ownerToken,
          host: hostname(),
          pid: process.pid,
          releasedAt: new Date().toISOString(),
        }, this.#ownedStep);
      }
    } catch (error) {
      failure = error;
    }
    try {
      await this.#releaseLock();
    } catch (error) {
      failure ??= error;
    }
    if (failure) throw failure;
  }

  readonly #ownedStep: OwnedStep = async <T>(operation: () => Promise<T>): Promise<T> => {
    await this.#checkOwnership();
    const result = await operation();
    await this.#checkOwnership();
    return result;
  };

  async #checkOwnership(): Promise<void> {
    if (this.#closed || !this.#lockHandle) {
    throw new Error('異動日誌已關閉');
    }
    const [handleInfo, pathInfo] = await Promise.all([
      this.#lockHandle.stat(),
      lstat(this.lockPath),
    ]);
    if (!handleInfo.isFile() || handleInfo.nlink !== 1 || !pathInfo.isFile()
      || pathInfo.isSymbolicLink() || pathInfo.nlink !== 1
      || handleInfo.dev !== this.#lockIdentity.dev || handleInfo.ino !== this.#lockIdentity.ino
      || pathInfo.dev !== this.#lockIdentity.dev || pathInfo.ino !== this.#lockIdentity.ino) {
    throw new Error('異動日誌鎖定身分識別已變更');
    }
  }

  async #releaseLock(): Promise<void> {
    if (this.#closed) return;
    const lockHandle = this.#lockHandle;
    this.#lockHandle = undefined;
    let failure: unknown;
    await lockHandle?.close().catch((error) => { failure ??= error; });
    this.#closed = true;
    if (failure) throw failure;
  }
}

export async function openMutationJournal(options: OpenMutationJournalOptions): Promise<MutationJournal> {
  return MutationJournal.open(options);
}

export async function withMutationJournal<T>(
  options: OpenMutationJournalOptions,
  callback: (journal: MutationJournal) => Promise<T>,
): Promise<T> {
  const journal = await openMutationJournal(options);
  try {
    return await callback(journal);
  } finally {
    await journal.close();
  }
}
