---
description: 'Power BI 自訂視覺效果開發的綜合指南，涵蓋 React、D3.js 整合、TypeScript 模式、測試框架和進階視覺化技術。'
applyTo: '**/*.{ts,tsx,js,jsx,json,less,css}'
---

# Power BI 自訂視覺效果開發最佳實務

## 概述
本文件根據 Microsoft 的官方指南和社群最佳實務，提供使用現代網路技術（包括 React、D3.js、TypeScript 和進階測試框架）開發 Power BI 自訂視覺效果的綜合說明。

## 開發環境設定

### 1. 專案初始化
```typescript
// 全域安裝 Power BI 視覺效果工具
npm install -g powerbi-visuals-tools

// 建立新的視覺效果專案
pbiviz new MyCustomVisual
cd MyCustomVisual

// 啟動開發伺服器
pbiviz start
```

### 2. TypeScript 配置
```json
{
    "compilerOptions": {
        "jsx": "react",
        "types": ["react", "react-dom"],
        "allowJs": false,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "target": "es6",
        "sourceMap": true
        "outDir": "./.tmp/build/",
        "moduleResolution": "node",
        "declaration": true
        "lib": [
            "es2015",
            "dom"
        ]
    },
    "files": [
        "./src/visual.ts"
    ]
}
```

## 核心視覺效果開發模式

### 1. 基本視覺效果結構
```typescript
"use strict";
import powerbi from "powerbi-visuals-api";

import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.IVisualHost;

import "./../style/visual.less";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        
        if (!dataView) {
            return;
        }

        // 視覺效果更新邏輯在此
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
```

### 2. 資料檢視處理
```typescript
// 單一資料對應範例
export class Visual implements IVisual {
    private valueText: HTMLParagraphElement;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.valueText = document.createElement("p");
        this.target.appendChild(this.valueText);
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        const singleDataView: DataViewSingle = dataView.single;

        if (!singleDataView || !singleDataView.value ) {
            return;
        }

        this.valueText.innerText = singleDataView.value.toString();
    }
}
```

## React 整合

### 1. React 視覺效果設定
```typescript
import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactCircleCard from "./component";

export class Visual implements IVisual {
    private target: HTMLElement;
    private reactRoot: React.ComponentElement<any, any>;

    constructor(options: VisualConstructorOptions) {
        this.reactRoot = React.createElement(ReactCircleCard, {});
        this.target = options.element;

        ReactDOM.render(this.reactRoot, this.target);
    }

    public update(options: VisualUpdateOptions) {
        const dataView: DataView = options.dataViews[0];
        
        if (dataView) {
            const reactProps = this.parseDataView(dataView);
            this.reactRoot = React.createElement(ReactCircleCard, reactProps);
            ReactDOM.render(this.reactRoot, this.target);
        }
    }

    private parseDataView(dataView: DataView): any {
        // 轉換 Power BI 資料以用於 React 元件
        return {
            data: dataView.categorical?.values?.[0]?.values || [],
            categories: dataView.categorical?.categories?.[0]?.values || []
        };
    }
}
```

### 2. 帶有 Props 的 React 元件
```typescript
// Power BI 視覺效果的 React 元件
import * as React from "react";

export interface ReactCircleCardProps {
    data: number[];
    categories: string[];
    size?: number;
    color?: string;
}

export const ReactCircleCard: React.FC<ReactCircleCardProps> = (props) => {
    const { data, categories, size = 200, color = "#3498db" } = props;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    
    return (
        <div className="react-circle-card">
            {data.map((value, index) => {
                const radius = ((value - minValue) / (maxValue - minValue)) * size / 2;
                return (
                    <div key={index} className="data-point">
                        <div 
                            className="circle"
                            style={{
                                width: radius * 2,
                                height: radius * 2,
                                backgroundColor: color,
                                borderRadius: '50%'
                            }}
                        />
                        <span className="label">{categories[index]}: {value}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default ReactCircleCard;
```

## D3.js 整合

### 1. 帶有 TypeScript 的 D3
```typescript
import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

export class Visual implements IVisual {
    private svg: Selection<SVGElement>;
    private container: Selection<SVGElement>;
    private host: IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.svg = d3.select(options.element)
            .append('svg')
            .classed('visual-svg', true);
        
        this.container = this.svg
            .append('g')
            .classed('visual-container', true);
    }

    public update(options: VisualUpdateOptions) {
        const dataView = options.dataViews[0];
        
        if (!dataView) {
            return;
        }

        const width = options.viewport.width;
        const height = options.viewport.height;
        
        this.svg
            .attr('width', width)
            .attr('height', height);

        // D3 資料繫結和視覺化邏輯
        this.renderChart(dataView, width, height);
    }

    private renderChart(dataView: DataView, width: number, height: number): void {
        const data = this.transformData(dataView);
        
        // 建立比例尺
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.category))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([height, 0]);

        // 繫結資料並建立長條
        const bars = this.container.selectAll('.bar')
            .data(data);

        bars.enter()
            .append('rect')
            .classed('bar', true)
            .merge(bars)
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.value))
            .style('fill', '#3498db');

        bars.exit().remove();
    }

    private transformData(dataView: DataView): any[] {
        // 將 Power BI DataView 轉換為 D3 友善的格式
        const categorical = dataView.categorical;
        const categories = categorical.categories[0];
        const values = categorical.values[0];

        return categories.values.map((category, index) => ({
            category: category.toString(),
            value: values.values[index] as number
        }));
    }
}
```

### 2. 進階 D3 模式
```typescript
// 帶有互動的複雜 D3 視覺化
export class AdvancedD3Visual implements IVisual {
    private svg: Selection<SVGElement>;
    private tooltip: Selection<HTMLDivElement>;
    private selectionManager: ISelectionManager;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        
        // 建立主要 SVG
        this.svg = d3.select(options.element)
            .append('svg');
        
        // 建立工具提示
        this.tooltip = d3.select(options.element)
            .append('div')
            .classed('tooltip', true)
            .style('opacity', 0);
    }

    private createInteractiveElements(data: VisualDataPoint[]): void {
        const circles = this.svg.selectAll('.data-circle')
            .data(data);

        const circlesEnter = circles.enter()
            .append('circle')
            .classed('data-circle', true);

        circlesEnter.merge(circles)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.radius)
            .style('fill', d => d.color)
            .style('stroke', d => d.strokeColor)
            .style('stroke-width', d => `${d.strokeWidth}px`)
            .on('click', (event, d) => {
                // 處理選取
                this.selectionManager.select(d.selectionId, event.ctrlKey);
            })
            .on('mouseover', (event, d) => {
                // 顯示工具提示
                this.tooltip
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`${d.category}: ${d.value}`);
            })
            .on('mouseout', () => {
                // 隱藏工具提示
                this.tooltip.style('opacity', 0);
            });

        circles.exit().remove();
    }
}
```

## 進階視覺效果功能

### 1. 自訂格式化模型
```typescript
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

export class VisualFormattingSettingsModel extends formattingSettings.CompositeFormattingSettingsModel {
    // 顏色設定卡片
    public colorCard: ColorCardSettings = new ColorCardSettings();
    
    // 資料點設定卡片  
    public dataPointCard: DataPointCardSettings = new DataPointCardSettings();
    
    // 一般設定卡片
    public generalCard: GeneralCardSettings = new GeneralCardSettings();

    public cards: formattingSettings.SimpleCard[] = [this.colorCard, this.dataPointCard, this.generalCard];
}

export class ColorCardSettings extends formattingSettings.SimpleCard {
    name: string = "colorCard";
    displayName: string = "顏色";

    public defaultColor: formattingSettings.ColorPicker = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayName: "預設顏色",
        value: { value: "#3498db" }
    });

    public showAllDataPoints: formattingSettings.ToggleSwitch = new formattingSettings.ToggleSwitch({
        name: "showAllDataPoints",
        displayName: "顯示全部",
        value: false
    });
}
```

### 2. 互動性和選取
```typescript
import { interactivitySelectionService, baseBehavior } from "powerbi-visuals-utils-interactivityutils";

export interface VisualDataPoint extends interactivitySelectionService.SelectableDataPoint {
    value: powerbi.PrimitiveValue;
    category: string;
    color: string;
    selectionId: ISelectionId;
}

export class VisualBehavior extends baseBehavior.BaseBehavior<VisualDataPoint> {
    protected bindClick() {
        // 實作資料點選取的點擊行為
        this.behaviorOptions.clearCatcher.on('click', () => {
            this.selectionHandler.handleClearSelection();
        });

        this.behaviorOptions.elementsSelection.on('click', (event, dataPoint) => {
            event.stopPropagation();
            this.selectionHandler.handleSelection(dataPoint, event.ctrlKey);
        });
    }

    protected bindContextMenu() {
        // 實作上下文功能表行為
        this.behaviorOptions.elementsSelection.on('contextmenu', (event, dataPoint) => {
            this.selectionHandler.handleContextMenu(
                dataPoint ? dataPoint.selectionId : null,
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
        });
    }
}
```

### 3. 登陸頁面實作
```typescript
export class Visual implements IVisual {
    private element: HTMLElement;
    private isLandingPageOn: boolean;
    private LandingPageRemoved: boolean;
    private LandingPage: d3.Selection<any>;

    constructor(options: VisualConstructorOptions) {
        this.element = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.HandleLandingPage(options);
    }

    private HandleLandingPage(options: VisualUpdateOptions) {
        if(!options.dataViews || !options.dataViews[0]?.metadata?.columns?.length){
            if(!this.isLandingPageOn) {
                this.isLandingPageOn = true;
                const SampleLandingPage: Element = this.createSampleLandingPage();
                this.element.appendChild(SampleLandingPage);
                this.LandingPage = d3.select(SampleLandingPage);
            }
        } else {
            if(this.isLandingPageOn && !this.LandingPageRemoved){
                this.LandingPageRemoved = true;
                this.LandingPage.remove();
            }
        }
    }

    private createSampleLandingPage(): Element {
        const landingPage = document.createElement("div");
        landingPage.className = "landing-page";
        landingPage.innerHTML = "
            <div class=\"landing-page-content\">
                <h2>自訂視覺效果</h2>
                <p>新增資料以開始使用</p>
                <div class=\"landing-page-icon\">📊</div>
            </div>
        ";
        return landingPage;
    }
}
```

## 測試框架

### 1. 單元測試設定
```typescript
// 用於測試的 Webpack 配置
const path = require('path');
const webpack = require("webpack");

module.exports = {
    devtool: 'source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.tsx?$/i,
                enforce: 'post',
                include: path.resolve(__dirname, 'src'),
                exclude: /(node_modules|resources\/js\/vendor)/,
                loader: 'coverage-istanbul-loader',
                options: { esModules: true }
            }
        ]
    },
    externals: {
        "powerbi-visuals-api": '{}'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css']
    },
    output: {
        path: path.resolve(__dirname, ".tmp/test")
    },
    plugins: [
        new webpack.ProvidePlugin({
            'powerbi-visuals-api': null
        })
    ]
};
```

### 2. 視覺效果測試公用程式
```typescript
// Power BI 視覺效果的測試公用程式
export class VisualTestUtils {
    public static d3Click(element: JQuery, x: number, y: number): void {
        const event = new MouseEvent('click', {
            clientX: x,
            clientY: y,
            button: 0
        });
        element[0].dispatchEvent(event);
    }

    public static d3KeyEvent(element: JQuery, typeArg: string, keyArg: string, keyCode: number): void {
        const event = new KeyboardEvent(typeArg, {
            key: keyArg,
            code: keyArg,
            keyCode: keyCode
        });
        element[0].dispatchEvent(event);
    }

    public static createVisualHost(): IVisualHost {
        return {
            createSelectionIdBuilder: () => new SelectionIdBuilder(),
            createSelectionManager: () => new SelectionManager(),
            colorPalette: new ColorPalette(),
            eventService: new EventService(),
            tooltipService: new TooltipService()
        } as IVisualHost;
    }

    public static createUpdateOptions(dataView: DataView, viewport?: IViewport): VisualUpdateOptions {
        return {
            dataViews: [dataView],
            viewport: viewport || { width: 500, height: 500 },
            operationKind: VisualDataChangeOperationKind.Create,
            type: VisualUpdateType.Data
        };
    }
}
```

### 3. 元件測試
```typescript
// React 元件的 Jest 測試
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactCircleCard from '../src/component';

describe('ReactCircleCard', () => {
    const mockProps = {
        data: [10, 20, 30],
        categories: ['A', 'B', 'C'],
        size: 200,
        color: '#3498db'
    };

    test('renders with correct data points', () => {
        render(<ReactCircleCard {...mockProps} />);
        
        expect(screen.getByText('A: 10')).toBeInTheDocument();
        expect(screen.getByText('B: 20')).toBeInTheDocument();
        expect(screen.getByText('C: 30')).toBeInTheDocument();
    });

    test('applies correct styling', () => {
        render(<ReactCircleCard {...mockProps} />);
        
        const circles = document.querySelectorAll('.circle');
        expect(circles).toHaveLength(3);
        
        circles.forEach(circle => {
            expect(circle).toHaveStyle('backgroundColor: #3498db');
            expect(circle).toHaveStyle('borderRadius: 50%');
        });
    });

    test('handles empty data gracefully', () => {
        const emptyProps = { ...mockProps, data: [], categories: [] };
        const { container } = render(<ReactCircleCard {...emptyProps} />);
        
        expect(container.querySelector('.data-point')).toBeNull();
    });
});
```

## 進階模式

### 1. 對話方塊實作
```typescript
import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import DialogAction = powerbi.DialogAction;
import * as ReactDOM from 'react-dom';
import * as React from 'react';

export class CustomDialog {
    private dialogContainer: HTMLElement;

    constructor(options: DialogConstructorOptions) {
        this.dialogContainer = options.element;
        this.initializeDialog();
    }

    private initializeDialog(): void {
        const dialogContent = React.createElement(DialogContent, {
            onSave: this.handleSave.bind(this),
            onCancel: this.handleCancel.bind(this)
        });

        ReactDOM.render(dialogContent, this.dialogContainer);
    }

    private handleSave(data: any): void {
        // 處理儲存動作
        this.closeDialog(DialogAction.Save, data);
    }

    private handleCancel(): void {
        // 處理取消動作
        this.closeDialog(DialogAction.Cancel);
    }

    private closeDialog(action: DialogAction, data?: any): void {
        // 關閉帶有動作和可選資料的對話方塊
        powerbi.extensibility.visual.DialogUtils.closeDialog(action, data);
    }
}
```

### 2. 條件式格式整合
```typescript
import powerbiVisualsApi from "powerbi-visuals-api";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

export class Visual implements IVisual {
    private colorHelper: ColorHelper;

    constructor(options: VisualConstructorOptions) {
        this.colorHelper = new ColorHelper(
            options.host.colorPalette,
            { objectName: "dataPoint", propertyName: "fill" },
            "#3498db"  // 預設顏色
        );
    }

    private applyConditionalFormatting(dataPoints: VisualDataPoint[]): VisualDataPoint[] {
        return dataPoints.map(dataPoint => {
            // 取得條件式格式顏色
            const color = this.colorHelper.getColorForDataPoint(dataPoint.dataViewObject);
            
            return {
                ...dataPoint,
                color: color,
                strokeColor: this.darkenColor(color, 0.2),
                strokeWidth: 2
            };
        });
    }

    private darkenColor(color: string, amount: number): string {
        // 用於加深描邊顏色的公用函式
        const colorObj = d3.color(color);
        return colorObj ? colorObj.darker(amount).toString() : color;
    }
}
```

### 3. 工具提示整合
```typescript
import { createTooltipServiceWrapper, TooltipEventArgs, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

export class Visual implements IVisual {
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(options: VisualConstructorOptions) {
        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            options.host.tooltipService,
            options.element
        );
    }

    private addTooltips(selection: d3.Selection<any, VisualDataPoint, any, any>): void {
        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: TooltipEventArgs<VisualDataPoint>) => {
                const dataPoint = tooltipEvent.data;
                return [
                    {
                        displayName: "類別",
                        value: dataPoint.category
                    },
                    {
                        displayName: "值", 
                        value: dataPoint.value.toString()
                    },
                    {
                        displayName: "百分比",
                        value: `${((dataPoint.value / this.totalValue) * 100).toFixed(1)}%`
                    }
                ];
            }
        );
    }
}
```

## 效能最佳化

### 1. 資料縮減策略
```json
// 具有資料縮減的視覺效果功能
"dataViewMappings": {
    "categorical": {
        "categories": {
            "for": { "in": "category" },
            "dataReductionAlgorithm": {
                "window": {
                    "count": 300
                }
            }  
        },
        "values": {
            "group": {
                "by": "series",
                "select": [{
                    "for": {
                        "in": "measure"
                    }
                }],
                "dataReductionAlgorithm": {
                    "top": {
                        "count": 100
                    }
                }  
            }
        }
    }
}
```

### 2. 高效渲染模式
```typescript
export class OptimizedVisual implements IVisual {
    private animationFrameId: number;
    private renderQueue: (() => void)[] = [];

    public update(options: VisualUpdateOptions) {
        // 將渲染操作排入佇列，而不是立即執行
        this.queueRender(() => this.performUpdate(options));
    }

    private queueRender(renderFunction: () => void): void {
        this.renderQueue.push(renderFunction);
        
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.processRenderQueue();
            });
        }
    }

    private processRenderQueue(): void {
        // 處理所有排入佇列的渲染操作
        while (this.renderQueue.length > 0) {
            const renderFunction = this.renderQueue.shift();
            if (renderFunction) {
                renderFunction();
            }
        }
        
        this.animationFrameId = null;
    }

    private performUpdate(options: VisualUpdateOptions): void {
        // 使用虛擬 DOM 或高效的差異比較策略
        const currentData = this.transformData(options.dataViews[0]);
        
        if (this.hasDataChanged(currentData)) {
            this.renderVisualization(currentData);
            this.previousData = currentData;
        }
    }

    private hasDataChanged(newData: any[]): boolean {
        // 高效的資料比較
        return JSON.stringify(newData) !== JSON.stringify(this.previousData);
    }
}
```

請記住：自訂視覺效果開發需要了解 Power BI 的視覺效果框架和現代網路開發實務。專注於建立可重複使用、可測試且高效能的視覺效果，以增強 Power BI 生態系統。
