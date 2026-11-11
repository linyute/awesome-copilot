// 版權所有 (c) 微軟公司。保留所有權利。
// 依據 MIT 授權條款進行授權。

// 改編自 https://github.com/eiriktsarpalis/PolyType/blob/main/src/PolyType.Roslyn/SourceWriter.cs
using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.CodeAnalysis.Text;

namespace Product.Analyzers;

/// <summary>
/// 用於產生具一致縮排原始程式碼的公用程式類別。
/// </summary>
/// <remarks>
/// 縮排會自動套用於每個非空白行的開頭，
/// 因此呼叫端絕不應在其寫入的文字中嵌入前導空白字元。
/// 大括號區塊請使用 <see cref="OpenBlock"/>/<see cref="CloseBlock"/>，
/// 未加上大括號的縮排文字（例如建構子初始設定式）請使用 <see cref="Indent"/>。
/// </remarks>
internal sealed class SourceWriter
{
    // 固定的換行字元可使跨平台產生的輸出具備確定性。
    private const string NewLine = "\r\n";

    private readonly StringBuilder builder = new();
    private int indentation;
    private bool atLineStart = true;

    /// <summary>
    /// 初始化 <see cref="SourceWriter"/> 類別的新執行個體。
    /// </summary>
    public SourceWriter()
        : this('\t', 1)
    {
    }

    /// <summary>
    /// 初始化 <see cref="SourceWriter"/> 類別的新執行個體。
    /// </summary>
    /// <param name="indentationChar">用於縮排的空白字元。</param>
    /// <param name="charsPerIndentation">每個縮排層級的字元數。</param>
    public SourceWriter(char indentationChar, int charsPerIndentation)
    {
        if (!char.IsWhiteSpace(indentationChar))
        {
            throw new ArgumentOutOfRangeException(nameof(indentationChar));
        }

        if (charsPerIndentation < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(charsPerIndentation));
        }

        this.IndentationChar = indentationChar;
        this.CharsPerIndentation = charsPerIndentation;
    }

    /// <summary>
    /// 取得用於縮排的字元。
    /// </summary>
    public char IndentationChar { get; }

    /// <summary>
    /// 取得每個縮排層級的字元數。
    /// </summary>
    public int CharsPerIndentation { get; }

    /// <summary>
    /// 取得產生的原始程式碼長度。
    /// </summary>
    public int Length => this.builder.Length;

    /// <summary>
    /// 取得或設定目前的縮排層級。
    /// </summary>
    /// <remarks>
    /// 優先使用可維持縮排平衡的 <see cref="OpenBlock"/>、<see cref="CloseBlock"/> 以及 <see cref="Indent"/>，
    /// 而非直接設定此屬性。
    /// </remarks>
    public int Indentation
    {
        get => this.indentation;
        set
        {
            if (value < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(value));
            }

            this.indentation = value;
        }
    }

    /// <summary>
    /// 寫入一個字元；若該字元位於行首，則先進行縮排。
    /// </summary>
    /// <param name="value">要寫入的非換行字元。使用 <see cref="WriteLine()"/> 來結束一行。</param>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    /// <exception cref="ArgumentException">當 <paramref name="value"/> 為歸位字元 (CR) 或換行字元 (LF) 時擲出。</exception>
    public SourceWriter Write(char value)
    {
        if (value is '\r' or '\n')
        {
            throw new ArgumentException("請使用 WriteLine() 寫入換行字元。", nameof(value));
        }

        this.AddIndentationIfAtLineStart();
        this.builder.Append(value);
        return this;
    }

    /// <summary>
    /// 寫入文字而不結束該行；若位於行首，則先進行縮排。
    /// </summary>
    /// <param name="text">要寫入的 C# 原始程式碼。嵌入的 CR、LF 與 CRLF 換行字元會開啟新的縮排文字行，並標準化為 CRLF。</param>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    /// <remarks>
    /// 使用此方法從多個片段建構一行文字，例如在迴圈中組裝成員簽章。
    /// </remarks>
    public SourceWriter Write([StringSyntax("c#-test")] string text)
    {
        this.WriteLines(text, disableIndentation: false, endWithNewLine: false);
        return this;
    }

    /// <summary>
    /// 寫入一個字元並接續換行字元。
    /// </summary>
    /// <param name="value">要寫入的非換行字元。使用 <see cref="WriteLine()"/> 寫入空行。</param>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    /// <exception cref="ArgumentException">當 <paramref name="value"/> 為歸位字元 (CR) 或換行字元 (LF) 時擲出。</exception>
    public SourceWriter WriteLine(char value) => this.Write(value).WriteLine();

    /// <summary>
    /// 寫入文字並接續換行字元。
    /// </summary>
    /// <param name="text">要寫入的 C# 原始程式碼。每個嵌入的行皆會縮排，且 CR、LF 與 CRLF 換行字元會標準化為 CRLF。</param>
    /// <param name="disableIndentation">是否隱藏目前的縮排。</param>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    public SourceWriter WriteLine(
        [StringSyntax("c#-test")] string text,
        bool disableIndentation = false)
    {
        this.WriteLines(text, disableIndentation, endWithNewLine: true);
        return this;
    }

    /// <summary>
    /// 寫入一個換行字元。
    /// </summary>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    public SourceWriter WriteLine()
    {
        this.builder.Append(NewLine);
        this.atLineStart = true;
        return this;
    }

    /// <summary>
    /// 在其獨立行寫入左大括號，並增加縮排層級。
    /// </summary>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    /// <remarks>
    /// 當在行中呼叫時，該行會先結束，因此 <c>Write("class C").OpenBlock()</c> 會在下一行產生大括號。
    /// </remarks>
    public SourceWriter OpenBlock()
    {
        if (!this.atLineStart)
        {
            this.WriteLine();
        }

        this.WriteLine('{');
        this.indentation++;
        return this;
    }

    /// <summary>
    /// 減少縮排層級，並在其獨立行寫入右大括號。
    /// </summary>
    /// <param name="suffix">大括號後要寫入的文字，例如 <c>";"</c> 或 <c>")"</c>。</param>
    /// <returns>此寫入器，以便進行鏈結呼叫。</returns>
    /// <exception cref="InvalidOperationException">當沒有開啟的縮排層級時擲出。</exception>
    public SourceWriter CloseBlock(string suffix = "")
    {
        if (this.indentation == 0)
        {
            throw new InvalidOperationException("沒有可關閉的開啟區塊。");
        }

        if (!this.atLineStart)
        {
            this.WriteLine();
        }

        this.indentation--;
        return this.Write('}').WriteLine(suffix);
    }

    /// <summary>
    /// 增加縮排層級，直到傳回的值被處置 (disposed)。
    /// </summary>
    /// <returns>在處置時可還原先前縮排的值。</returns>
    /// <example>
    /// <code>
    /// writer.WriteLine("public C()");
    /// using (writer.Indent())
    /// {
    ///     writer.WriteLine(": base(1)");
    /// }
    /// </code>
    /// </example>
    public IndentationScope Indent()
    {
        this.indentation++;
        return new IndentationScope(this, this.indentation);
    }

    /// <summary>
    /// 傳回產生的原始程式碼文字。
    /// </summary>
    /// <returns>產生的原始程式碼。</returns>
    public SourceText ToSourceText()
    {
        if (this.builder.Length == 0)
        {
            throw new InvalidOperationException("未寫入任何內容。");
        }

        if (this.indentation != 0)
        {
            throw new InvalidOperationException($"縮排層級預期為 0，但實際為 {this.indentation}。");
        }

        return SourceText.From(this.builder.ToString(), Encoding.UTF8);
    }

    private static ReadOnlySpan<char> GetNextLine(ref ReadOnlySpan<char> remainingText, out bool isFinalLine)
    {
        if (remainingText.IsEmpty)
        {
            isFinalLine = true;
            return default;
        }

        int lineLength = remainingText.IndexOfAny('\r', '\n');
        ReadOnlySpan<char> rest;
        if (lineLength == -1)
        {
            lineLength = remainingText.Length;
            isFinalLine = true;
            rest = default;
        }
        else
        {
            int newlineLength = remainingText[lineLength] == '\r' &&
                lineLength + 1 < remainingText.Length &&
                remainingText[lineLength + 1] == '\n' ? 2 : 1;
            rest = remainingText[(lineLength + newlineLength)..];
            isFinalLine = false;
        }

        ReadOnlySpan<char> next = remainingText[..lineLength];
        remainingText = rest;
        return next;
    }

    private void WriteLines(string text, bool disableIndentation, bool endWithNewLine)
    {
        bool isFinalLine;
        ReadOnlySpan<char> remainingText = text.AsSpan();
        do
        {
            ReadOnlySpan<char> nextLine = GetNextLine(ref remainingText, out isFinalLine);

            // 空行不進行縮排，因此輸出不會有結尾空白字元。
            if (!nextLine.IsEmpty)
            {
                if (disableIndentation)
                {
                    this.atLineStart = false;
                }
                else
                {
                    this.AddIndentationIfAtLineStart();
                }

                this.AppendSpan(nextLine);
            }

            if (!isFinalLine || endWithNewLine)
            {
                this.WriteLine();
            }
        }
        while (!isFinalLine);
    }

    private void AddIndentationIfAtLineStart()
    {
        if (this.atLineStart)
        {
            this.builder.Append(this.IndentationChar, this.CharsPerIndentation * this.indentation);
            this.atLineStart = false;
        }
    }

    private void AppendSpan(ReadOnlySpan<char> span)
        => this.builder.Append(span.ToString());

    /// <summary>
    /// 在處置時將 <see cref="SourceWriter"/> 還原至先前的縮排。
    /// </summary>
    internal readonly struct IndentationScope : IDisposable
    {
        private readonly SourceWriter writer;
        private readonly int expectedIndentation;

        /// <summary>
        /// 初始化 <see cref="IndentationScope"/> 結構的新執行個體。
        /// </summary>
        /// <param name="writer">要還原縮排的寫入器。</param>
        /// <param name="expectedIndentation">此範圍所建立的縮排層級。</param>
        internal IndentationScope(SourceWriter writer, int expectedIndentation)
        {
            this.writer = writer;
            this.expectedIndentation = expectedIndentation;
        }

        /// <summary>
        /// 將寫入器的縮排減少一個層級。
        /// </summary>
        /// <exception cref="InvalidOperationException">當範圍內開啟的區塊尚未關閉時擲出。</exception>
        public void Dispose()
        {
            if (this.writer is null)
            {
                return;
            }

            if (this.writer.indentation != this.expectedIndentation)
            {
                throw new InvalidOperationException($"縮排層級預期為 {this.expectedIndentation}，但實際為 {this.writer.indentation}。在處置縮排範圍之前請先關閉內部區塊。");
            }

            this.writer.indentation--;
        }
    }
}
