// 獨立的 WinMD 快取產生器 — 每個套件去重複，支援多個專案。
// 從 NuGet 套件與 Windows SDK 解析 WinMD 檔案，匯出 JSON 快取
// 以套件+版本為索引鍵，以避免跨專案重複。
//
// 用法：
//   CacheGenerator <專案目錄> <輸出目錄>
//   CacheGenerator --scan <根目錄> <輸出目錄>

using System.Collections.Immutable;
using System.Reflection;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Security.Cryptography;
using System.Xml.Linq;

// --- 引數解析 ---

var scanMode = args.Contains("--scan");

// 解析 --winappsdk-runtime <路徑> 選項
string? winAppSdkRuntimePath = null;
for (int i = 0; i < args.Length - 1; i++)
{
    if (args[i].Equals("--winappsdk-runtime", StringComparison.OrdinalIgnoreCase))
    {
        winAppSdkRuntimePath = args[i + 1];
        break;
    }
}

var positionalArgs = args
    .Where(a => !a.StartsWith('-'))
    .Where(a => a != winAppSdkRuntimePath) // 排除執行階段路徑值
    .ToArray();

if (positionalArgs.Length < 2)
{
    Console.Error.WriteLine("Usage:");
    Console.Error.WriteLine("  CacheGenerator <project-dir> <output-dir>");
    Console.Error.WriteLine("  CacheGenerator --scan <root-dir> <output-dir>");
    Console.Error.WriteLine("  CacheGenerator --winappsdk-runtime <path> <project-dir> <output-dir>");
    Console.Error.WriteLine();
    Console.Error.WriteLine("  project-dir: Path containing .csproj/.vcxproj (or a project file itself)");
    Console.Error.WriteLine("  root-dir:    Root to scan recursively for project files");
    Console.Error.WriteLine("  output-dir:  Cache output (e.g. \"Generated Files\\winmd-cache\")");
    Console.Error.WriteLine("  --winappsdk-runtime: Path to installed WinAppSDK runtime (from Get-AppxPackage)");
    return 1;
}

var inputPath = Path.GetFullPath(positionalArgs[0]);
var outputDir = Path.GetFullPath(positionalArgs[1]);

var jsonOptions = new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    Converters = { new JsonStringEnumConverter() },
};

// --- 尋找專案檔案 ---

var projectFiles = new List<string>();

if (scanMode)
{
    if (!Directory.Exists(inputPath))
    {
        Console.Error.WriteLine($"Error: Root directory not found: {inputPath}");
        return 1;
    }

    var enumerationOptions = new EnumerationOptions
    {
        RecurseSubdirectories = true,
        IgnoreInaccessible = true,
        MatchType = MatchType.Simple,
    };

    projectFiles.AddRange(Directory.EnumerateFiles(inputPath, "*.csproj", enumerationOptions));
    projectFiles.AddRange(Directory.EnumerateFiles(inputPath, "*.vcxproj", enumerationOptions));

    // 排除常見的非原始碼目錄
    projectFiles = projectFiles
        .Where(f => !f.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
        .Where(f => !f.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
        .Where(f => !f.Contains($"{Path.DirectorySeparatorChar}node_modules{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
        .ToList();
}
else if (File.Exists(inputPath) && (inputPath.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) ||
                                     inputPath.EndsWith(".vcxproj", StringComparison.OrdinalIgnoreCase)))
{
    projectFiles.Add(inputPath);
}
else if (Directory.Exists(inputPath))
{
    projectFiles.AddRange(Directory.GetFiles(inputPath, "*.csproj"));
    projectFiles.AddRange(Directory.GetFiles(inputPath, "*.vcxproj"));
}
else
{
    Console.Error.WriteLine($"Error: Path not found: {inputPath}");
    return 1;
}

if (projectFiles.Count == 0)
{
    Console.Error.WriteLine($"No .csproj or .vcxproj files found in: {inputPath}");
    return 1;
}

// 始終將 CacheGenerator.csproj 作為 WinAppSDK WinMD 檔案的基準來源。
// 它引用了 Microsoft.WindowsAppSDK 並設定 ExcludeAssets="all"，因此套件會
// 在還原/建構期間下載，但不會影響工具的編譯。
var selfCsproj = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "CacheGenerator.csproj");
selfCsproj = Path.GetFullPath(selfCsproj);
if (File.Exists(selfCsproj) && !projectFiles.Any(f =>
    Path.GetFullPath(f).Equals(selfCsproj, StringComparison.OrdinalIgnoreCase)))
{
    projectFiles.Add(selfCsproj);
}

Console.WriteLine($"WinMD Cache Generator (per-package deduplicate)");
Console.WriteLine($"  Output:   {outputDir}");
Console.WriteLine($"  Projects: {projectFiles.Count}");

// --- 處理每個專案 ---

var totalPackagesCached = 0;
var totalPackagesSkipped = 0;
var totalProjectsProcessed = 0;

foreach (var projectFile in projectFiles)
{
    var projectDir = Path.GetDirectoryName(projectFile)!;
    var projectName = Path.GetFileNameWithoutExtension(projectFile);

    Console.WriteLine($"\n--- {projectName} ({Path.GetFileName(projectFile)}) ---");

    // 尋找包含 WinMD 檔案的套件
    var packages = NuGetResolver.FindPackagesWithWinMd(projectDir, projectFile, winAppSdkRuntimePath);

    if (packages.Count == 0)
    {
        Console.WriteLine("  No packages with WinMD files (is the project restored?)");
        continue;
    }

    Console.WriteLine($"  {packages.Count} package(s) with WinMD files");
    totalProjectsProcessed++;

    var projectPackages = new List<ProjectPackageRef>();

    foreach (var pkg in packages)
    {
        var pkgCacheDir = Path.Combine(outputDir, "packages", pkg.Id, pkg.Version);
        var metaPath = Path.Combine(pkgCacheDir, "meta.json");

        if (File.Exists(metaPath))
        {
            Console.WriteLine($"  [cached] {pkg.Id}@{pkg.Version}");
            totalPackagesSkipped++;
        }
        else
        {
            Console.WriteLine($"  [parse]  {pkg.Id}@{pkg.Version} ({pkg.WinMdFiles.Count} WinMD file(s))");
            ExportPackageCache(pkg, pkgCacheDir);
            totalPackagesCached++;
        }

        projectPackages.Add(new ProjectPackageRef { Id = pkg.Id, Version = pkg.Version });
    }

    // 寫入專案資訊清單
    var manifest = new ProjectManifest
    {
        ProjectName = projectName,
        ProjectDir = projectDir,
        ProjectFile = Path.GetFileName(projectFile),
        Packages = projectPackages,
        GeneratedAt = DateTime.UtcNow.ToString("o"),
    };

    var projectsDir = Path.Combine(outputDir, "projects");
    Directory.CreateDirectory(projectsDir);

    // 在掃描模式下，不同的目錄可能包含同名的專案。
    // 附加一個簡短的路徑雜湊值，以避免覆寫資訊清單。
    var manifestFileName = projectName;
    if (scanMode)
    {
        var hashBytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(projectFile));
        var hashSuffix = Convert.ToHexString(hashBytes)[..8].ToLowerInvariant();
        manifestFileName = $"{projectName}_{hashSuffix}";
    }

    File.WriteAllText(
        Path.Combine(projectsDir, $"{manifestFileName}.json"),
        JsonSerializer.Serialize(manifest, jsonOptions));
}

Console.WriteLine($"\nDone: {totalProjectsProcessed} project(s) processed, " +
                  $"{totalPackagesCached} package(s) parsed, " +
                  $"{totalPackagesSkipped} reused from cache");
return 0;

// =============================================================================
// 將單一套件的 WinMD 資訊匯出至快取
// =============================================================================

void ExportPackageCache(PackageWithWinMd pkg, string cacheDir)
{
    var typesDir = Path.Combine(cacheDir, "types");
    Directory.CreateDirectory(typesDir);

    var allTypes = new List<WinMdTypeInfo>();
    foreach (var file in pkg.WinMdFiles)
    {
        allTypes.AddRange(WinMdParser.ParseFile(file));
    }

    var typesByNamespace = allTypes
        .GroupBy(t => t.Namespace)
        .ToDictionary(g => g.Key, g => g.ToList());

    var namespaces = typesByNamespace.Keys
        .Where(ns => !string.IsNullOrEmpty(ns))
        .OrderBy(ns => ns)
        .ToList();

    // 在保留的儲存貯體名稱下包含全域 (空白) 命名空間類型
    var hasGlobalNs = typesByNamespace.ContainsKey(string.Empty)
                      && typesByNamespace[string.Empty].Count > 0;
    const string globalNsBucket = "_GlobalNamespace";
    if (hasGlobalNs)
    {
        namespaces.Insert(0, globalNsBucket);
    }

    // meta.json
    var meta = new
    {
        PackageId = pkg.Id,
        Version = pkg.Version,
        WinMdFiles = pkg.WinMdFiles
            .Select(Path.GetFileName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList(),
        TotalTypes = allTypes.Count,
        TotalMembers = allTypes.Sum(t => t.Members.Count),
        TotalNamespaces = namespaces.Count,
        GeneratedAt = DateTime.UtcNow.ToString("o"),
    };

    File.WriteAllText(
        Path.Combine(cacheDir, "meta.json"),
        JsonSerializer.Serialize(meta, jsonOptions));

    // namespaces.json
    File.WriteAllText(
        Path.Combine(cacheDir, "namespaces.json"),
        JsonSerializer.Serialize(namespaces, jsonOptions));

    // types/<命名空間>.json
    foreach (var ns in namespaces)
    {
        var lookupKey = ns == globalNsBucket ? string.Empty : ns;
        var types = typesByNamespace[lookupKey];
        var safeFileName = ns.Replace('.', '_') + ".json";
        File.WriteAllText(
            Path.Combine(typesDir, safeFileName),
            JsonSerializer.Serialize(types, jsonOptions));
    }
}

// =============================================================================
// 資料模型
// =============================================================================

enum TypeKind { Class, Struct, Enum, Interface, Delegate }

enum MemberKind { Method, Property, Event, Field }

sealed class WinMdTypeInfo
{
    public required string Namespace { get; init; }
    public required string Name { get; init; }
    public required string FullName { get; init; }
    public required TypeKind Kind { get; init; }
    public string? BaseType { get; init; }
    public required List<WinMdMemberInfo> Members { get; init; }
    public List<string>? EnumValues { get; init; }
    public required string SourceFile { get; init; }
}

sealed class WinMdMemberInfo
{
    public required string Name { get; init; }
    public required MemberKind Kind { get; init; }
    public required string Signature { get; init; }
    public string? ReturnType { get; init; }
    public List<WinMdParameterInfo>? Parameters { get; init; }
}

sealed class WinMdParameterInfo
{
    public required string Name { get; init; }
    public required string Type { get; init; }
}

sealed class ProjectPackageRef
{
    public required string Id { get; init; }
    public required string Version { get; init; }
}

sealed class ProjectManifest
{
    public required string ProjectName { get; init; }
    public required string ProjectDir { get; init; }
    public required string ProjectFile { get; init; }
    public required List<ProjectPackageRef> Packages { get; init; }
    public required string GeneratedAt { get; init; }
}

// =============================================================================
// NuGet 解析器 — 尋找具有 WinMD 檔案的套件，傳回結構化資料
// =============================================================================

record PackageWithWinMd(string Id, string Version, List<string> WinMdFiles);

static class NuGetResolver
{
    public static List<PackageWithWinMd> FindPackagesWithWinMd(string projectDir, string projectFile, string? winAppSdkRuntimePath)
    {
        var result = new List<PackageWithWinMd>();

        // 1. 嘗試 project.assets.json (PackageReference — .csproj 和現代 .vcxproj)
        var assetsPath = FindProjectAssetsJson(projectDir);
        if (assetsPath is not null)
        {
            result.AddRange(FindPackagesFromAssets(assetsPath));
        }

        // 2. 嘗試 packages.config (使用 NuGet packages.config 的舊版 .vcxproj / .csproj)
        if (result.Count == 0)
        {
            var packagesConfig = Path.Combine(projectDir, "packages.config");
            if (File.Exists(packagesConfig))
            {
                result.AddRange(FindPackagesFromConfig(packagesConfig, projectDir));
            }
        }

        // 3. 專案引用 — 從 .csproj/.vcxproj XML 解析 <ProjectReference>，
        //    然後檢查每個被引用專案的 bin/ 目錄中是否有 .winmd 建構輸出。
        //    這是尋找產生 WinMD 之類別庫的可靠方式。
        result.AddRange(FindWinMdFromProjectReferences(projectFile));

        // 4. 將 Windows SDK 視為虛擬「套件」
        var sdkWinMd = FindWindowsSdkWinMd();
        if (sdkWinMd.Files.Count > 0)
        {
            result.Add(new PackageWithWinMd("WindowsSDK", sdkWinMd.Version, sdkWinMd.Files));
        }

        // 5. 將已安裝的 WinAppSDK 執行階段視為虛擬「套件」
        //    對於不透過 NuGet 引用 WinAppSDK 的 Electron/Node.js 應用程式非常有用。
        var runtimeWinMd = FindWinAppSdkRuntimeWinMd(winAppSdkRuntimePath);
        if (runtimeWinMd.Files.Count > 0)
        {
            result.Add(new PackageWithWinMd("WinAppSdkRuntime", runtimeWinMd.Version, runtimeWinMd.Files));
        }

        // 以 (Id, Version) 去重複，合併來自多個來源的 WinMdFiles
        return result
            .GroupBy(p => (p.Id.ToLowerInvariant(), p.Version.ToLowerInvariant()))
            .Select(g =>
            {
                var merged = g.SelectMany(p => p.WinMdFiles)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                var first = g.First();
                return new PackageWithWinMd(first.Id, first.Version, merged);
            })
            .ToList();
    }

    /// <summary>
    /// Parse &lt;ProjectReference&gt; from .csproj/.vcxproj and find .winmd output
    /// bin/ 目錄中尋找 .winmd 輸出。
    /// </summary>
    internal static List<PackageWithWinMd> FindWinMdFromProjectReferences(string projectFile)
    {
        var result = new List<PackageWithWinMd>();

        try
        {
            var doc = XDocument.Load(projectFile);
            var ns = doc.Root?.Name.Namespace ?? XNamespace.None;
            var projectRefs = doc.Descendants(ns + "ProjectReference")
                .Select(e => e.Attribute("Include")?.Value)
                .Where(v => v is not null)
                .ToList();

            if (projectRefs.Count == 0)
            {
                return result;
            }

            var projectDir = Path.GetDirectoryName(projectFile)!;

            foreach (var refPath in projectRefs)
            {
                var refFullPath = Path.GetFullPath(Path.Combine(projectDir, refPath!));
                if (!File.Exists(refFullPath))
                {
                    continue;
                }

                var refProjectDir = Path.GetDirectoryName(refFullPath)!;
                var refProjectName = Path.GetFileNameWithoutExtension(refFullPath);
                var refBinDir = Path.Combine(refProjectDir, "bin");

                if (!Directory.Exists(refBinDir))
                {
                    continue;
                }

                var winmdFiles = Directory.GetFiles(refBinDir, "*.winmd", SearchOption.AllDirectories)
                    .Where(f => !Path.GetFileName(f).Equals("Windows.winmd", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                // 以檔案名稱去重複 (在 Debug/Release/x64 等之間相同的 WinMD)
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                winmdFiles = winmdFiles
                    .Where(f => seen.Add(Path.GetFileName(f)))
                    .ToList();

                if (winmdFiles.Count > 0)
                {
                    result.Add(new PackageWithWinMd($"ProjectRef.{refProjectName}", "local", winmdFiles));
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to parse project references: {ex.Message}");
        }

        return result;
    }

    internal static string? FindProjectAssetsJson(string projectDir)
    {
        // 標準位置
        var assetsPath = Path.Combine(projectDir, "obj", "project.assets.json");
        if (File.Exists(assetsPath))
        {
            return assetsPath;
        }

        // 有時在特定平台子目錄下
        var objDir = Path.Combine(projectDir, "obj");
        if (Directory.Exists(objDir))
        {
            var found = Directory.GetFiles(objDir, "project.assets.json", SearchOption.AllDirectories);
            if (found.Length > 0)
            {
                // 挑選最近寫入的檔案，以避免多目標建構建立多個
                // 資產檔案時產生的非確定性選擇。
                string? bestPath = null;
                DateTime bestWriteTime = DateTime.MinValue;

                foreach (var path in found)
                {
                    try
                    {
                        var writeTime = File.GetLastWriteTimeUtc(path);
                        if (writeTime > bestWriteTime)
                        {
                            bestWriteTime = writeTime;
                            bestPath = path;
                        }
                    }
                    catch
                    {
                        // 忽略無法存取其 Metadata 的檔案
                    }
                }

                if (bestPath is not null)
                {
                    return bestPath;
                }
            }
        }

        return null;
    }

    internal static List<PackageWithWinMd> FindPackagesFromAssets(string assetsPath)
    {
        var result = new List<PackageWithWinMd>();

        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(assetsPath));
            var root = doc.RootElement;

            var packageFolders = new List<string>();
            if (root.TryGetProperty("packageFolders", out var folders))
            {
                foreach (var folder in folders.EnumerateObject())
                {
                    packageFolders.Add(folder.Name);
                }
            }

            if (!root.TryGetProperty("libraries", out var libraries))
            {
                return result;
            }

            foreach (var lib in libraries.EnumerateObject())
            {
                // 僅將類型為 "package" 的程式庫視為 NuGet 套件；
                // 跳過專案引用和其他進入點類型。
                if (!lib.Value.TryGetProperty("type", out var typeProp) ||
                    !string.Equals(typeProp.GetString(), "package", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                // 索引鍵格式："PackageId/Version"
                var slashIdx = lib.Name.IndexOf('/');
                if (slashIdx < 0)
                {
                    continue;
                }

                var packageId = lib.Name[..slashIdx];
                var version = lib.Name[(slashIdx + 1)..];

                if (!lib.Value.TryGetProperty("path", out var pathProp))
                {
                    continue;
                }

                var libPath = pathProp.GetString();
                if (libPath is null)
                {
                    continue;
                }

                var winmdFiles = new List<string>();
                foreach (var folder in packageFolders)
                {
                    var fullPath = Path.Combine(folder, libPath);
                    if (!Directory.Exists(fullPath))
                    {
                        continue;
                    }

                    winmdFiles.AddRange(
                        Directory.GetFiles(fullPath, "*.winmd", SearchOption.AllDirectories));
                }

                // 以檔案名稱去重複 (WinMD 是與架構無關的 Metadata)
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                winmdFiles = winmdFiles
                    .Where(f => seen.Add(Path.GetFileName(f)))
                    .ToList();

                if (winmdFiles.Count > 0)
                {
                    result.Add(new PackageWithWinMd(packageId, version, winmdFiles));
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to parse project.assets.json: {ex.Message}");
        }

        return result;
    }

    /// <summary>
    /// 解析 packages.config (某些 .vcxproj 和舊式 .csproj 使用的舊版 NuGet 格式)。
    /// 尋找解決方案層級的 "packages/" 資料夾或 NuGet 全域快取。
    /// </summary>
    internal static List<PackageWithWinMd> FindPackagesFromConfig(string configPath, string projectDir)
    {
        var result = new List<PackageWithWinMd>();

        try
        {
            var doc = System.Xml.Linq.XDocument.Load(configPath);
            var packages = doc.Root?.Elements("package");
            if (packages is null)
            {
                return result;
            }

            // 使用 packages.config 的儲存庫通常具有解決方案層級的 "packages/" 資料夾。
            // 從專案目錄向上尋找它。
            var packagesFolder = FindSolutionPackagesFolder(projectDir);

            // 同時檢查 NuGet 全域套件快取 (尊重 NUGET_PACKAGES 覆寫)
            var globalPackages = Environment.GetEnvironmentVariable("NUGET_PACKAGES");
            if (string.IsNullOrWhiteSpace(globalPackages))
            {
                globalPackages = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    ".nuget", "packages");
            }

            foreach (var pkg in packages)
            {
                var id = pkg.Attribute("id")?.Value;
                var version = pkg.Attribute("version")?.Value;
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(version))
                {
                    continue;
                }

                var winmdFiles = new List<string>();

                // 檢查解決方案層級的 packages/ 資料夾 (格式：packages/<id>.<version>/)
                if (packagesFolder is not null)
                {
                    var pkgDir = Path.Combine(packagesFolder, $"{id}.{version}");
                    if (Directory.Exists(pkgDir))
                    {
                        winmdFiles.AddRange(
                            Directory.GetFiles(pkgDir, "*.winmd", SearchOption.AllDirectories));
                    }
                }

                // 遞補：NuGet 全域快取 (格式：<id>/<version>/)
                if (winmdFiles.Count == 0 && Directory.Exists(globalPackages))
                {
                    var pkgDir = Path.Combine(globalPackages, id.ToLowerInvariant(), version);
                    if (Directory.Exists(pkgDir))
                    {
                        winmdFiles.AddRange(
                            Directory.GetFiles(pkgDir, "*.winmd", SearchOption.AllDirectories));
                    }
                }

                // 以檔案名稱去重複
                var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                winmdFiles = winmdFiles
                    .Where(f => seen.Add(Path.GetFileName(f)))
                    .ToList();

                if (winmdFiles.Count > 0)
                {
                    result.Add(new PackageWithWinMd(id, version, winmdFiles));
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to parse packages.config: {ex.Message}");
        }

        return result;
    }

    /// <summary>
    /// 從專案目錄向上尋找解決方案層級的 "packages/" 資料夾。
    /// </summary>
    internal static string? FindSolutionPackagesFolder(string startDir)
    {
        var dir = startDir;
        for (var i = 0; i < 5; i++) // 最多向上尋找 5 層
        {
            var packagesDir = Path.Combine(dir, "packages");
            if (Directory.Exists(packagesDir))
            {
                return packagesDir;
            }

            var parent = Directory.GetParent(dir);
            if (parent is null)
            {
                break;
            }

            dir = parent.FullName;
        }

        return null;
    }

    internal static (List<string> Files, string Version) FindWindowsSdkWinMd()
    {
        var windowsKitsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            "Windows Kits", "10", "UnionMetadata");

        if (!Directory.Exists(windowsKitsPath))
        {
            return ([], "unknown");
        }

        // 僅篩選具有版本編號的目錄 (跳過 "Facade" 等)，並
        // 依數字版本而非按字母順序排序，以挑選最高的 SDK。
        var versionDirs = Directory.GetDirectories(windowsKitsPath)
            .Select(d => (Dir: d, Name: Path.GetFileName(d)))
            .Where(x => !string.IsNullOrEmpty(x.Name) && char.IsDigit(x.Name[0]))
            .Select(x => Version.TryParse(x.Name, out var v)
                ? (Dir: x.Dir, Version: v)
                : (Dir: (string?)null, Version: (Version?)null))
            .Where(x => x.Dir is not null && x.Version is not null)
            .OrderByDescending(x => x.Version)
            .Select(x => x.Dir!)
            .ToList();

        foreach (var versionDir in versionDirs)
        {
            var windowsWinMd = Path.Combine(versionDir, "Windows.winmd");
            if (File.Exists(windowsWinMd))
            {
                var version = Path.GetFileName(versionDir);
                return ([windowsWinMd], version);
            }
        }

        return ([], "unknown");
    }

    /// <summary>
    /// 從已安裝的 WinAppSDK 執行階段路徑讀取 WinMD 檔案 (透過 PowerShell 中的
    /// Get-AppxPackage 發現並作為 --winappsdk-runtime 引數傳遞)。
    /// WindowsApps 資料夾受 ACL 限制，因此 C# 無法直接列舉。
    /// </summary>
    internal static (List<string> Files, string Version) FindWinAppSdkRuntimeWinMd(string? runtimePath)
    {
        if (string.IsNullOrEmpty(runtimePath) || !Directory.Exists(runtimePath))
        {
            return ([], "unknown");
        }

        try
        {
            var winmdFiles = Directory.EnumerateFiles(runtimePath, "*.winmd", SearchOption.TopDirectoryOnly)
                .ToList();

            if (winmdFiles.Count > 0)
            {
                // 從路徑擷取 SDK 版本：...Microsoft.WindowsAppRuntime.1.8_... -> "1.8"
                var dirName = Path.GetFileName(runtimePath);
                var prefix = dirName.Split('_')[0]; // "Microsoft.WindowsAppRuntime.1.8"
                var sdkVersion = prefix.Length > "Microsoft.WindowsAppRuntime.".Length
                    ? prefix["Microsoft.WindowsAppRuntime.".Length..]
                    : dirName;

                return (winmdFiles, sdkVersion);
            }
        }
        catch
        {
            // 路徑可能無法存取；正常降級
        }

        return ([], "unknown");
    }
}

// =============================================================================
// 簽署類型提供者 — 將 Metadata 簽署解碼為可讀取的字串
// =============================================================================

sealed class SimpleTypeProvider : ISignatureTypeProvider<string, object?>
{
    public string GetPrimitiveType(PrimitiveTypeCode typeCode) => typeCode switch
    {
        PrimitiveTypeCode.Boolean => "Boolean",
        PrimitiveTypeCode.Byte => "Byte",
        PrimitiveTypeCode.SByte => "SByte",
        PrimitiveTypeCode.Char => "Char",
        PrimitiveTypeCode.Int16 => "Int16",
        PrimitiveTypeCode.UInt16 => "UInt16",
        PrimitiveTypeCode.Int32 => "Int32",
        PrimitiveTypeCode.UInt32 => "UInt32",
        PrimitiveTypeCode.Int64 => "Int64",
        PrimitiveTypeCode.UInt64 => "UInt64",
        PrimitiveTypeCode.Single => "Single",
        PrimitiveTypeCode.Double => "Double",
        PrimitiveTypeCode.String => "String",
        PrimitiveTypeCode.Object => "Object",
        PrimitiveTypeCode.Void => "void",
        PrimitiveTypeCode.IntPtr => "IntPtr",
        PrimitiveTypeCode.UIntPtr => "UIntPtr",
        PrimitiveTypeCode.TypedReference => "TypedReference",
        _ => typeCode.ToString(),
    };

    public string GetTypeFromDefinition(MetadataReader reader, TypeDefinitionHandle handle, byte rawTypeKind)
    {
        var typeDef = reader.GetTypeDefinition(handle);
        var name = reader.GetString(typeDef.Name);
        var ns = reader.GetString(typeDef.Namespace);
        return string.IsNullOrEmpty(ns) ? name : $"{ns}.{name}";
    }

    public string GetTypeFromReference(MetadataReader reader, TypeReferenceHandle handle, byte rawTypeKind)
    {
        var typeRef = reader.GetTypeReference(handle);
        var name = reader.GetString(typeRef.Name);
        var ns = reader.GetString(typeRef.Namespace);
        return string.IsNullOrEmpty(ns) ? name : $"{ns}.{name}";
    }

    public string GetSZArrayType(string elementType) => $"{elementType}[]";

    public string GetArrayType(string elementType, ArrayShape shape) =>
        $"{elementType}[{new string(',', shape.Rank - 1)}]";

    public string GetByReferenceType(string elementType) => $"ref {elementType}";
    public string GetPointerType(string elementType) => $"{elementType}*";
    public string GetPinnedType(string elementType) => elementType;

    public string GetGenericInstantiation(string genericType, ImmutableArray<string> typeArguments)
    {
        var name = genericType;
        var backtick = name.IndexOf('`');
        if (backtick >= 0)
        {
            name = name[..backtick];
        }

        return $"{name}<{string.Join(", ", typeArguments)}>";
    }

    public string GetGenericMethodParameter(object? genericContext, int index) => $"TMethod{index}";
    public string GetGenericTypeParameter(object? genericContext, int index) => $"T{index}";
    public string GetModifiedType(string modifier, string unmodifiedType, bool isRequired) => unmodifiedType;
    public string GetFunctionPointerType(MethodSignature<string> signature) => "delegate*";

    public string GetTypeFromSpecification(MetadataReader reader, object? genericContext,
        TypeSpecificationHandle handle, byte rawTypeKind)
    {
        return reader.GetTypeSpecification(handle).DecodeSignature(this, genericContext);
    }
}

// =============================================================================
// WinMD 解析器 — 將 WinMD 檔案讀取為結構化的類型資訊
// =============================================================================

static class WinMdParser
{
    public static List<WinMdTypeInfo> ParseFile(string filePath)
    {
        var types = new List<WinMdTypeInfo>();

        try
        {
            using var stream = File.OpenRead(filePath);
            using var peReader = new PEReader(stream);

            if (!peReader.HasMetadata)
            {
                return types;
            }

            var reader = peReader.GetMetadataReader();
            var typeProvider = new SimpleTypeProvider();

            foreach (var typeDefHandle in reader.TypeDefinitions)
            {
                var typeDef = reader.GetTypeDefinition(typeDefHandle);
                var name = reader.GetString(typeDef.Name);
                var ns = reader.GetString(typeDef.Namespace);

                if (ShouldSkipType(name, typeDef))
                {
                    continue;
                }

                var kind = DetermineTypeKind(reader, typeDef);
                var baseType = GetBaseTypeName(reader, typeDef);
                var members = ParseMembers(reader, typeDef, typeProvider);
                var enumValues = kind == TypeKind.Enum ? ParseEnumValues(reader, typeDef) : null;
                var fullName = string.IsNullOrEmpty(ns) ? name : $"{ns}.{name}";

                types.Add(new WinMdTypeInfo
                {
                    Namespace = ns,
                    Name = name,
                    FullName = fullName,
                    Kind = kind,
                    BaseType = baseType,
                    Members = members,
                    EnumValues = enumValues,
                    SourceFile = Path.GetFileName(filePath),
                });
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Warning: Failed to parse {filePath}: {ex.Message}");
        }

        return types;
    }

    internal static bool ShouldSkipType(string name, TypeDefinition typeDef)
    {
        if (string.IsNullOrEmpty(name) || name == "<Module>" || name.StartsWith('<'))
        {
            return true;
        }

        var visibility = typeDef.Attributes & TypeAttributes.VisibilityMask;
        return visibility != TypeAttributes.Public && visibility != TypeAttributes.NestedPublic;
    }

    internal static TypeKind DetermineTypeKind(MetadataReader reader, TypeDefinition typeDef)
    {
        if ((typeDef.Attributes & TypeAttributes.Interface) != 0)
        {
            return TypeKind.Interface;
        }

        var baseType = GetBaseTypeName(reader, typeDef);
        return baseType switch
        {
            "System.Enum" => TypeKind.Enum,
            "System.ValueType" => TypeKind.Struct,
            "System.MulticastDelegate" or "System.Delegate" => TypeKind.Delegate,
            _ => TypeKind.Class,
        };
    }

    private static string? GetBaseTypeName(MetadataReader reader, TypeDefinition typeDef)
    {
        if (typeDef.BaseType.IsNil)
        {
            return null;
        }

        return typeDef.BaseType.Kind switch
        {
            HandleKind.TypeDefinition => GetTypeDefName(reader, (TypeDefinitionHandle)typeDef.BaseType),
            HandleKind.TypeReference => GetTypeRefName(reader, (TypeReferenceHandle)typeDef.BaseType),
            _ => null,
        };
    }

    private static string GetTypeDefName(MetadataReader reader, TypeDefinitionHandle handle)
    {
        var td = reader.GetTypeDefinition(handle);
        var ns = reader.GetString(td.Namespace);
        var name = reader.GetString(td.Name);
        return string.IsNullOrEmpty(ns) ? name : $"{ns}.{name}";
    }

    private static string GetTypeRefName(MetadataReader reader, TypeReferenceHandle handle)
    {
        var tr = reader.GetTypeReference(handle);
        var ns = reader.GetString(tr.Namespace);
        var name = reader.GetString(tr.Name);
        return string.IsNullOrEmpty(ns) ? name : $"{ns}.{name}";
    }

    private static List<WinMdMemberInfo> ParseMembers(
        MetadataReader reader, TypeDefinition typeDef, SimpleTypeProvider typeProvider)
    {
        var members = new List<WinMdMemberInfo>();

        // 收集屬性/事件存取子方法，以便在方法迴圈中跳過它們
        var accessorMethods = new HashSet<MethodDefinitionHandle>();
        foreach (var propHandle in typeDef.GetProperties())
        {
            var accessors = reader.GetPropertyDefinition(propHandle).GetAccessors();
            if (!accessors.Getter.IsNil) accessorMethods.Add(accessors.Getter);
            if (!accessors.Setter.IsNil) accessorMethods.Add(accessors.Setter);
        }

        foreach (var eventHandle in typeDef.GetEvents())
        {
            var accessors = reader.GetEventDefinition(eventHandle).GetAccessors();
            if (!accessors.Adder.IsNil) accessorMethods.Add(accessors.Adder);
            if (!accessors.Remover.IsNil) accessorMethods.Add(accessors.Remover);
            if (!accessors.Raiser.IsNil) accessorMethods.Add(accessors.Raiser);
        }

        // 方法
        foreach (var methodHandle in typeDef.GetMethods())
        {
            if (accessorMethods.Contains(methodHandle))
            {
                continue;
            }

            var method = reader.GetMethodDefinition(methodHandle);
            var methodName = reader.GetString(method.Name);

            if (methodName.StartsWith('.') || methodName.StartsWith('<'))
            {
                continue;
            }

            if ((method.Attributes & MethodAttributes.MemberAccessMask) != MethodAttributes.Public)
            {
                continue;
            }

            try
            {
                var sig = method.DecodeSignature(typeProvider, null);
                var parameters = GetMethodParameters(reader, method, sig);
                var paramStr = string.Join(", ", parameters.Select(p => $"{p.Type} {p.Name}"));

                members.Add(new WinMdMemberInfo
                {
                    Name = methodName,
                    Kind = MemberKind.Method,
                    Signature = $"{sig.ReturnType} {methodName}({paramStr})",
                    ReturnType = sig.ReturnType,
                    Parameters = parameters,
                });
            }
            catch
            {
                members.Add(new WinMdMemberInfo
                {
                    Name = methodName,
                    Kind = MemberKind.Method,
                    Signature = $"{methodName}(/* signature not decodable */)",
                });
            }
        }

        // 屬性
        foreach (var propHandle in typeDef.GetProperties())
        {
            var prop = reader.GetPropertyDefinition(propHandle);
            var propName = reader.GetString(prop.Name);

            try
            {
                var propSig = prop.DecodeSignature(typeProvider, null);
                var propType = propSig.ReturnType;
                var accessors = prop.GetAccessors();

                var hasGetter = false;
                if (!accessors.Getter.IsNil)
                {
                    var getterDef = reader.GetMethodDefinition(accessors.Getter);
                    if ((getterDef.Attributes & MethodAttributes.MemberAccessMask) == MethodAttributes.Public)
                    {
                        hasGetter = true;
                    }
                }

                var hasSetter = false;
                if (!accessors.Setter.IsNil)
                {
                    var setterDef = reader.GetMethodDefinition(accessors.Setter);
                    if ((setterDef.Attributes & MethodAttributes.MemberAccessMask) == MethodAttributes.Public)
                    {
                        hasSetter = true;
                    }
                }

                // 跳過存取子皆非公開的屬性
                if (!hasGetter && !hasSetter)
                {
                    continue;
                }
                var accessStr = (hasGetter, hasSetter) switch
                {
                    (true, true) => "{ get; set; }",
                    (true, false) => "{ get; }",
                    (false, true) => "{ set; }",
                    _ => "{ }",
                };

                members.Add(new WinMdMemberInfo
                {
                    Name = propName,
                    Kind = MemberKind.Property,
                    Signature = $"{propType} {propName} {accessStr}",
                    ReturnType = propType,
                });
            }
            catch
            {
                members.Add(new WinMdMemberInfo
                {
                    Name = propName,
                    Kind = MemberKind.Property,
                    Signature = $"/* type not decodable */ {propName}",
                });
            }
        }

        // 事件
        foreach (var eventHandle in typeDef.GetEvents())
        {
            var evt = reader.GetEventDefinition(eventHandle);
            var evtName = reader.GetString(evt.Name);
            var accessors = evt.GetAccessors();

            var isPublicEvent = false;
            if (!accessors.Adder.IsNil)
            {
                var adder = reader.GetMethodDefinition(accessors.Adder);
                if ((adder.Attributes & MethodAttributes.MemberAccessMask) == MethodAttributes.Public)
                {
                    isPublicEvent = true;
                }
            }

            if (!isPublicEvent && !accessors.Remover.IsNil)
            {
                var remover = reader.GetMethodDefinition(accessors.Remover);
                if ((remover.Attributes & MethodAttributes.MemberAccessMask) == MethodAttributes.Public)
                {
                    isPublicEvent = true;
                }
            }

            if (!isPublicEvent)
            {
                continue;
            }

            var evtType = GetHandleTypeName(reader, evt.Type);

            members.Add(new WinMdMemberInfo
            {
                Name = evtName,
                Kind = MemberKind.Event,
                Signature = $"event {evtType} {evtName}",
                ReturnType = evtType,
            });
        }

        return members;
    }

    private static List<WinMdParameterInfo> GetMethodParameters(
        MetadataReader reader, MethodDefinition method, MethodSignature<string> sig)
    {
        var parameters = new List<WinMdParameterInfo>();
        var paramHandles = method.GetParameters().ToList();
        var paramNames = new List<string>();

        foreach (var ph in paramHandles)
        {
            var param = reader.GetParameter(ph);
            if (param.SequenceNumber > 0)
            {
                paramNames.Add(reader.GetString(param.Name));
            }
        }

        for (var i = 0; i < sig.ParameterTypes.Length; i++)
        {
            parameters.Add(new WinMdParameterInfo
            {
                Name = i < paramNames.Count ? paramNames[i] : $"arg{i}",
                Type = sig.ParameterTypes[i],
            });
        }

        return parameters;
    }

    internal static List<string> ParseEnumValues(MetadataReader reader, TypeDefinition typeDef)
    {
        var values = new List<string>();

        foreach (var fieldHandle in typeDef.GetFields())
        {
            var field = reader.GetFieldDefinition(fieldHandle);
            var fieldName = reader.GetString(field.Name);

            if (fieldName == "value__")
            {
                continue;
            }

            if ((field.Attributes & FieldAttributes.FieldAccessMask) == FieldAttributes.Public &&
                (field.Attributes & FieldAttributes.Static) != 0)
            {
                values.Add(fieldName);
            }
        }

        return values;
    }

    private static string GetHandleTypeName(MetadataReader reader, EntityHandle handle) => handle.Kind switch
    {
        HandleKind.TypeDefinition => GetTypeDefName(reader, (TypeDefinitionHandle)handle),
        HandleKind.TypeReference => GetTypeRefName(reader, (TypeReferenceHandle)handle),
        HandleKind.TypeSpecification => DecodeTypeSpecification(reader, (TypeSpecificationHandle)handle),
        _ => "unknown",
    };

    private static string DecodeTypeSpecification(MetadataReader reader, TypeSpecificationHandle handle)
    {
        try
        {
            var typeSpec = reader.GetTypeSpecification(handle);
            return typeSpec.DecodeSignature(new SimpleTypeProvider(), null);
        }
        catch
        {
            return "unknown";
        }
    }
}
