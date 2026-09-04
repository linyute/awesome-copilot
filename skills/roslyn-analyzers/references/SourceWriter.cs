// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// 改編自 https://github.com/eiriktsarpalis/PolyType/blob/main/src/PolyType.Roslyn/SourceWriter.cs
using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.CodeAnalysis.Text;

namespace Product.Analyzers;

/// <summary>
/// 用於產生一致縮排原始程式碼的公用程式類別。
/// </summary>
internal sealed class SourceWriter
{
    // 固定的換行字元可使產生的輸出在跨平台時具確定性。
    private const string NewLine = "\r\n";

    private readonly StringBuilder builder = new();
    private int indentation;

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
    /// 寫入一個字元並加上換行。
    /// </summary>
    /// <param name="value">要寫入的字元。</param>
    public void WriteLine(char value)
    {
        this.AddIndentation();
        this.builder.Append(value);
        this.builder.Append(NewLine);
    }

    /// <summary>
    /// 寫入文字並加上換行。
    /// </summary>
    /// <param name="text">要寫入的 C# 原始程式碼。</param>
    /// <param name="disableIndentation">是否隱藏目前的縮排。</param>
    public void WriteLine(
        [StringSyntax("c#-test")] string text,
        bool disableIndentation = false)
    {
        bool isFinalLine;
        ReadOnlySpan<char> remainingText = text.AsSpan();
        do
        {
            ReadOnlySpan<char> nextLine = GetNextLine(ref remainingText, out isFinalLine);
            if (!disableIndentation && this.indentation > 0)
            {
                this.AddIndentation();
            }

            this.AppendSpan(nextLine);
            this.builder.Append(NewLine);
        }
        while (!isFinalLine);
    }

    /// <summary>
    /// 寫入換行。
    /// </summary>
    public void WriteLine() => this.builder.Append(NewLine);

    /// <summary>
    /// 回傳產生的原始程式碼文字。
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
            throw new InvalidOperationException($"縮排層級預期應為 0，但實際為 {this.indentation}。");
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

        int lineLength = remainingText.IndexOf('\n');
        ReadOnlySpan<char> rest;
        if (lineLength == -1)
        {
            lineLength = remainingText.Length;
            isFinalLine = true;
            rest = default;
        }
        else
        {
            rest = remainingText[(lineLength + 1)..];
            isFinalLine = false;
        }

        if ((uint)lineLength > 0 && remainingText[lineLength - 1] == '\r')
        {
            lineLength--;
        }

        ReadOnlySpan<char> next = remainingText[..lineLength];
        remainingText = rest;
        return next;
    }

    private void AddIndentation()
        => this.builder.Append(this.IndentationChar, this.CharsPerIndentation * this.indentation);

    private void AppendSpan(ReadOnlySpan<char> span)
        => this.builder.Append(span.ToString());
}
