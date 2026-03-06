# 遊戲開發演算法 (Game Development Algorithms)

這是一份涵蓋遊戲開發基本演算法的綜合參考，包括線條繪製、射線投射、碰撞偵測、物理模擬以及向量數學。

---

## Bresenham 線條演算法 — 射線投射、視線與路徑規劃 (Bresenham's Line Algorithm -- Raycasting, Line of Sight, and Pathfinding)

> 來源：https://deepnight.net/tutorial/bresenham-magic-raycasting-line-of-sight-pathfinding/

### 它是什麼 (What It Is)

Bresenham 線條演算法是一種用於確定網格中哪些儲存格位於兩點之間的直線上的高效方法。最初為在點陣顯示器上繪製像素而開發，它已成為遊戲開發中射線投射、視線檢查以及以網格為基礎的路徑規劃的基礎工具。該演算法僅使用整數運算（加法、減法和位移），執行速度極快。

### 數學 / 演算法概念 (Mathematical / Algorithmic Concepts)

核心想法是沿著主要軸（距離較大的軸）每次前進一個儲存格，同時累積一個誤差項 (error term)，用以追蹤真實線條與當前次要軸位置的偏差程度。當誤差超過閾值時，次要軸座標就會遞增。

關鍵特性：
- **僅限整數運算**：無須浮點數除法或乘法。
- **增量誤差累積**：透過整數誤差項追蹤分數斜率，避免漂移。
- **對稱性**：透過調整步進正負號，該演算法在不同線條方向上的運作方式完全相同。

給定兩個網格點 `(x0, y0)` 和 `(x1, y1)`：

```
dx = abs(x1 - x0)
dy = abs(y1 - y0)
```

誤差項在每步中都會進行初始化與更新。當它跨越零時，次要軸就會步進。

### 虛擬程式碼 (Pseudocode)

```
function bresenham(x0, y0, x1, y1):
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)
    sx = sign(x1 - x0)   // -1 或 +1
    sy = sign(y1 - y0)   // -1 或 +1
    err = dx - dy

    while true:
        visit(x0, y0)          // 處理或記錄此儲存格

        if x0 == x1 AND y0 == y1:
            break

        e2 = 2 * err

        if e2 > -dy:
            err = err - dy
            x0  = x0 + sx

        if e2 < dx:
            err = err + dx
            y0  = y0 + sy
```

### Haxe 實作（源自來源） (Haxe Implementation (from source))

```haxe
public function hasLineOfSight(x0:Int, y0:Int, x1:Int, y1:Int):Bool {
    var dx = hxd.Math.iabs(x1 - x0);
    var dy = hxd.Math.iabs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
        if (isBlocking(x0, y0))
            return false;

        if (x0 == x1 && y0 == y1)
            return true;

        var e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}
```

### 實際遊戲開發應用 (Practical Game Development Applications)

- **視線 (Line of Sight, LOS)**：從實體向目標進行 Bresenham 線條步進；如果路徑上的任何儲存格是牆壁或障礙物，則視線被遮擋。
- **網格射線投射 (Raycasting on grids)**：從光源向多個方向投射射線，以計算可見性地圖或視野錐體。
- **以網格為基礎的路徑規劃驗證**：在計算出一條路徑（例如透過 A*）後，使用 Bresenham 檢查驗證路徑點之間的直線捷徑是否暢通無阻。
- **投射物追蹤**：在圖塊式遊戲中確定子彈或投射物穿過哪些圖塊。
- **光照與陰影投射**：從光源追蹤射線，以計算 2D 網格上的受光與陰影儲存格。

---

## 碰撞偵測與反應系統 (Collision Detection and Response Systems)

> 來源：https://medium.com/@erikkubiak/dev-log-1-custom-engine-writing-my-collision-system-2a97856f9a93

### 它是什麼 (What It Is)

碰撞系統負責偵測遊戲物件何時重疊或相交，然後解決這些重疊，使物件做出物理反應（彈跳、停止、滑動）。建構自訂碰撞系統涉及選擇合適的邊界形狀、實作重疊測試以及設計解決策略。

### 數學 / 演算法概念 (Mathematical / Algorithmic Concepts)

#### 邊界形狀 (Bounding Shapes)

- **AABB (軸對齊邊界框)**：一個邊與座標軸對齊的矩形。由位置（中心或左上角）和半寬定義。重疊測試速度快，但對於旋轉或不規則形狀不夠精確。
- **圓形 / 球體碰撞器**：由中心和半徑定義。重疊測試僅是簡單的距離比較。
- **OBB (定向邊界框)**：一個旋轉的矩形。使用分離軸定理 (Separating Axis Theorem) 進行重疊測試。

#### AABB vs AABB 重疊測試 (AABB vs AABB Overlap Test)

兩個軸對齊邊界框當且僅當它們在每個軸上都重疊時，才發生重疊：

```
overlapX = (a.x - a.halfW < b.x + b.halfW) AND (a.x + a.halfW > b.x - b.halfW)
overlapY = (a.y - a.halfH < b.y + b.halfH) AND (a.y + a.halfH > b.y - b.halfH)
collision = overlapX AND overlapY
```

#### 圓形 vs 圓形重疊測試 (Circle vs Circle Overlap Test)

```
dx = a.x - b.x
dy = a.y - b.y
distSquared = dx * dx + dy * dy
collision = distSquared < (a.radius + b.radius) ^ 2
```

比較平方距離可避免昂貴的平方根運算。

#### 分離軸定理 (Separating Axis Theorem, SAT)

如果存在至少一個軸，使得兩個凸形狀在該軸上的投影不重疊，則這兩個形狀不碰撞。對於矩形，測試兩個矩形的邊法線。如果所有投影都重疊，則形狀發生碰撞。

#### 掃描與剪枝 (Sweep and Prune)（寬相） (Sweep and Prune (Broad Phase))

與其測試每一對物件 (O(n^2))，不如沿著一個軸依物件的最小範圍進行排序。在該軸上不重疊的物件不可能碰撞，因此從詳細檢查中剪除。

### 虛擬程式碼 — 碰撞偵測與解決 (Pseudocode -- Collision Detection and Resolution)

```
// 寬相 (Broad phase)：空間雜湊 (spatial hash) 或掃描與剪枝 (sweep-and-prune)
candidates = broadPhase(allObjects)

for each pair (a, b) in candidates:
    overlap = narrowPhaseTest(a, b)

    if overlap:
        // 計算穿透向量 (penetration vector)
        penetration = computePenetration(a, b)

        // 解決：沿著最小穿透軸將物件推開
        if a.isStatic:
            b.position += penetration
        else if b.isStatic:
            a.position -= penetration
        else:
            a.position -= penetration * 0.5
            b.position += penetration * 0.5

        // 選用：套用衝量 (impulse) 以進行速度反應
        relativeVelocity = a.velocity - b.velocity
        impulse = computeImpulse(relativeVelocity, penetration.normal, a.mass, b.mass)
        a.velocity -= impulse / a.mass
        b.velocity += impulse / b.mass
```

#### 最小穿透向量（針對 AABB） (Minimum Penetration Vector (for AABBs))

```
function computePenetration(a, b):
    overlapX_left  = (a.x + a.halfW) - (b.x - b.halfW)
    overlapX_right = (b.x + b.halfW) - (a.x - a.halfW)
    overlapY_top   = (a.y + a.halfH) - (b.y - b.halfH)
    overlapY_bot   = (b.y + b.halfH) - (a.y - a.halfH)

    minOverlapX = min(overlapX_left, overlapX_right)
    minOverlapY = min(overlapY_top, overlapY_bot)

    if minOverlapX < minOverlapY:
        return Vector(sign * minOverlapX, 0)
    else:
        return Vector(0, sign * minOverlapY)
```

### 空間分割策略 (Spatial Partitioning Strategies)

| 策略 | 最適合 | 說明 |
|---|---|---|
| **均勻網格 (Uniform Grid)** | 均勻分佈的物件 | 將世界劃分為固定儲存格；物件在其所處儲存格中註冊。 |
| **四元樹 (Quadtree)** | 非均勻分佈 | 遞迴地將空間劃分為 4 個象限。對稀疏場景高效。 |
| **空間雜湊 (Spatial Hash)** | 動態場景 | 將物件位置雜湊至桶 (buckets)。O(1) 查找鄰居。 |
| **掃描與剪枝 (Sweep and Prune)** | 許多移動物件 | 按軸排序；僅測試重疊的區間。 |

### 實際遊戲開發應用 (Practical Game Development Applications)

- **平台跳躍遊戲物理**：解決玩家與地形的碰撞，使角色降落在平台上且無法穿牆。
- **投射物命中偵測**：判斷投射物（通常是小型 AABB 或圓形）何時接觸到敵人或障礙物。
- **觸發區域**：偵測玩家何時進入某個區域（無物理解決的重疊測試）以觸發事件。
- **實體堆疊**：使用多次反覆解決處理相互堆疊的物件。

---

## 速度與速率 (Velocity and Speed)

> 來源：https://www.gamedev.net/tutorials/programming/math-and-physics/a-quick-lesson-in-velocity-and-speed-r6109/

### 它是什麼 (What It Is)

速度與速率是遊戲中移動物件的基礎概念。**速率 (Speed)** 是標量（僅有量值），而 **速度 (Velocity)** 是向量（具備量值與方向）。理解兩者的區別對於實作正確的移動、物理以及 AI 轉向行為至關重要。

### 數學 / 演算法概念 (Mathematical / Algorithmic Concepts)

#### 定義 (Definitions)

- **速率 (Speed)**：代表物件移動多快的標量值，與方向無關。
  ```
  speed = |velocity| = sqrt(vx^2 + vy^2)
  ```

- **速度 (Velocity)**：代表速率與方向的向量值。
  ```
  velocity = (vx, vy)
  ```

- **加速度 (Acceleration)**：速度隨時間變化的變化率。
  ```
  acceleration = (ax, ay)
  velocity += acceleration * deltaTime
  ```

#### 使用速度更新位置 (Updating Position with Velocity)

每影格，物件的位置會根據其速度更新，並依時間步長進行縮放：

```
position.x += velocity.x * deltaTime
position.y += velocity.y * deltaTime
```

這被稱為 **歐拉整合 (Euler integration)**，是最簡單的（一階）整合方法。

#### 標準化方向 (Normalizing Direction)

若要以固定速率朝給定方向移動，請標準化方向向量並乘以所需速率：

```
direction = target - current
length = sqrt(direction.x^2 + direction.y^2)
if length > 0:
    direction.x /= length
    direction.y /= length
velocity = direction * speed
```

這防止了「對角線移動問題」，即在兩個軸上全速對角線移動會導致約 1.414 倍的預期速率。

#### 影格率無關性 (Frame-Rate Independence)

如果沒有 `deltaTime`，移動速度將取決於影格率：

```
// 錯誤：與影格率相關
position += velocity

// 正確：與影格率無關
position += velocity * deltaTime
```

`deltaTime` 是自上次影格更新以來經過的時間（以秒為單位）。

### 虛擬程式碼 — 完整的移動更新 (Pseudocode -- Complete Movement Update)

```
function update(entity, deltaTime):
    // 套用加速度（重力、推力、摩擦力等）
    entity.velocity.x += entity.acceleration.x * deltaTime
    entity.velocity.y += entity.acceleration.y * deltaTime

    // 限制最大速率
    currentSpeed = magnitude(entity.velocity)
    if currentSpeed > entity.maxSpeed:
        entity.velocity = normalize(entity.velocity) * entity.maxSpeed

    // 套用摩擦力 / 阻力
    entity.velocity.x *= (1 - entity.friction * deltaTime)
    entity.velocity.y *= (1 - entity.friction * deltaTime)

    // 更新位置
    entity.position.x += entity.velocity.x * deltaTime
    entity.position.y += entity.velocity.y * deltaTime
```

### 實際遊戲開發應用 (Practical Game Development Applications)

- **角色移動**：每影格套用速度以平滑移動角色，並限制最大速率以獲得一致的手感。
- **投射物**：給予子彈或箭矢一個初始速度向量；每影格更新位置。
- **重力**：每影格對速度套用一個恆定的向下加速度以模擬墜落。
- **摩擦力與阻力**：透過乘以一個阻尼因子隨時間減少速度，以模擬表面摩擦力或空氣阻力。
- **AI 轉向**：計算朝向目標的期望速度，然後平滑地將當前速度調整至該方向（尋找、逃跑、抵達行為）。

---

## 物理引擎基礎 (Physics Engine Fundamentals)

> 來源：https://winter.dev/articles/physics-engine

### 它是什麼 (What It Is)

物理引擎模擬現實世界的物理行為 — 重力、碰撞、剛體動力學 — 使遊戲物件能夠逼真地移動與互動。物理引擎的核心迴圈包括：套用力、整合運動、偵測碰撞以及解決碰撞。

### 數學 / 演算法概念 (Mathematical / Algorithmic Concepts)

#### 物理迴圈 (The Physics Loop)

物理引擎執行一個固定時間步長的更新迴圈：

```
accumulator = 0
fixedDeltaTime = 1 / 60  // 60 Hz 物理頻率

function physicsUpdate(frameDeltaTime):
    accumulator += frameDeltaTime

    while accumulator >= fixedDeltaTime:
        step(fixedDeltaTime)
        accumulator -= fixedDeltaTime
```

使用固定時間步長可確保不論轉譯影格率為何，模擬行為都是具決定性且穩定的。

#### 整合方法 (Integration Methods)

**半隱式歐拉 (Semi-Implicit Euler)**（辛歐拉，symplectic Euler） — 遊戲物理的標準方法：

```
velocity += acceleration * dt
position += velocity * dt
```

這比顯式歐拉（先更新位置）更穩定，因為速度在用於更新位置之前已先更新。

**韋爾萊整合 (Verlet Integration)** — 一種不顯式儲存速度的替代方案：

```
newPosition = 2 * position - oldPosition + acceleration * dt * dt
oldPosition = position
position = newPosition
```

韋爾萊整合對於約束（布料、布娃娃）特別有用，因為可以直接操縱位置同時保留動量。

#### 剛體屬性 (Rigid Body Properties)

每個剛體具備：

| 屬性 | 說明 |
|---|---|
| `position` | 世界空間中的質心 |
| `velocity` | 線速度向量 |
| `acceleration` | 所有力的總和 / 質量 |
| `mass` | 對線性加速度的抗性 |
| `inverseMass` | `1 / mass`（靜態物件為 0） |
| `angle` | 旋轉角度 |
| `angularVelocity` | 旋轉速率 |
| `inertia` | 對角加速度的抗性 |
| `restitution` | 恢復係數/彈性（0 = 無彈跳，1 = 完全彈性） |
| `friction` | 表面摩擦係數 |

#### 力的累積 (Force Accumulation)

力在每影格中累積，然後轉換為加速度：

```
function applyForce(body, force):
    body.forceAccumulator += force

function integrate(body, dt):
    body.acceleration = body.forceAccumulator * body.inverseMass
    body.velocity += body.acceleration * dt
    body.position += body.velocity * dt
    body.forceAccumulator = (0, 0)  // 重設
```

#### 碰撞偵測管線 (Collision Detection Pipeline)

偵測階段分為兩個階段：

1. **寬相 (Broad Phase)**：使用邊界體積 (AABB) 和空間結構（網格、BVH 樹、掃描與剪枝）快速排除不可能碰撞的對。

2. **窄相 (Narrow Phase)**：對於候選對，執行精確的形狀對形狀測試，以判斷它們是否真的重疊，並計算接觸資訊（碰撞法線、穿透深度、接觸點）。

#### 使用衝量解決碰撞 (Collision Resolution with Impulses)

當兩個物體碰撞時，沿著碰撞法線套用一個衝量以分離它們並調整其速度：

```
function resolveCollision(a, b, normal, penetration):
    // 接觸點處的相對速度
    relVel = b.velocity - a.velocity
    velAlongNormal = dot(relVel, normal)

    // 如果物件正在分離，則不解決
    if velAlongNormal > 0:
        return

    // 恢復係數（取最小值）
    e = min(a.restitution, b.restitution)

    // 衝量大小
    j = -(1 + e) * velAlongNormal
    j /= a.inverseMass + b.inverseMass

    // 套用衝量
    impulse = j * normal
    a.velocity -= impulse * a.inverseMass
    b.velocity += impulse * b.inverseMass

    // 位置修正（防止下沉）
    correction = max(penetration - slop, 0) / (a.inverseMass + b.inverseMass) * percent
    a.position -= correction * a.inverseMass * normal
    b.position += correction * b.inverseMass * normal
```

關鍵常數：
- `slop`：一個微小的容許值（例如 0.01），用於防止微小穿透造成的抖動。
- `percent`：通常為 0.2 到 0.8；控制位置修正的套用強度。

#### 旋轉動力學 (Rotational Dynamics)

對於 2D 旋轉，扭矩 (torque) 是力的旋轉等效物：

```
torque = cross(contactPoint - centerOfMass, impulse)
angularAcceleration = torque * inverseInertia
angularVelocity += angularAcceleration * dt
angle += angularVelocity * dt
```

轉動慣量 (moment of inertia) 取決於形狀：
- **圓形**：`I = 0.5 * m * r^2`
- **矩形**：`I = (1/12) * m * (w^2 + h^2)`

### 虛擬程式碼 — 完整的物理步驟 (Pseudocode -- Complete Physics Step)

```
function step(dt):
    // 1. 套用外部力（重力、玩家輸入等）
    for each body in world.bodies:
        if not body.isStatic:
            body.applyForce(gravity * body.mass)

    // 2. 整合速度與位置
    for each body in world.bodies:
        if not body.isStatic:
            body.velocity += (body.forceAccumulator * body.inverseMass) * dt
            body.position += body.velocity * dt
            body.angularVelocity += body.torque * body.inverseInertia * dt
            body.angle += body.angularVelocity * dt
            body.forceAccumulator = (0, 0)
            body.torque = 0

    // 3. 寬相碰撞偵測
    pairs = broadPhase(world.bodies)

    // 4. 窄相碰撞偵測
    contacts = []
    for each (a, b) in pairs:
        contact = narrowPhase(a, b)
        if contact:
            contacts.append(contact)

    // 5. 解決碰撞（反覆式求解器，iterative solver）
    for i in range(solverIterations):   // 通常為 4-10 次反覆
        for each contact in contacts:
            resolveCollision(contact.a, contact.b,
                             contact.normal, contact.penetration)
```

### 實際遊戲開發應用 (Practical Game Development Applications)

- **平台跳躍遊戲**：重力、地面接觸、跳躍弧線以及移動平台。
- **俯視角遊戲**：沿牆壁滑動、攻擊造成的擊退。
- **布娃娃物理 (Ragdoll physics)**：由約束連接的一系列剛體。
- **載具模擬**：懸吊彈簧、輪胎摩擦力、引擎動力。
- **破壞效果**：將物件破碎成具有獨立物理主體的碎片。

---

## 遊戲開發中的向量數學 (Vector Mathematics for Game Development)

> 來源：https://www.gamedev.net/tutorials/programming/math-and-physics/vector-maths-for-game-dev-beginners-r5442/

### 它是什麼 (What It Is)

向量是遊戲開發的數學基石。向量代表一個同時具備量值與方向的量。在 2D 遊戲中，向量是數對 `(x, y)`；在 3D 遊戲中是三元組 `(x, y, z)`。幾乎所有的遊戲系統 — 移動、物理、轉譯、AI — 都依賴向量運算。

### 數學 / 演算法概念 (Mathematical / Algorithmic Concepts)

#### 向量表示法 (Vector Representation)

2D 向量：
```
v = (x, y)
```

3D 向量：
```
v = (x, y, z)
```

向量可以代表位置、方向、速度、力或任何具備量值與方向的量。

#### 向量加法 (Vector Addition)

分量相加。用於將速度套用到位置、組合多個力等。

```
a + b = (a.x + b.x, a.y + b.y)
```

**範例**：根據速度移動角色：
```
position = position + velocity * deltaTime
```

#### 向量減法 (Vector Subtraction)

分量相減。用於找出從一個點到另一個點的方向與距離。

```
a - b = (a.x - b.x, a.y - b.y)
```

**範例**：從敵人到玩家的方向：
```
directionToPlayer = player.position - enemy.position
```

#### 標量乘法 (Scalar Multiplication)

縮放向量的量值而不改變其方向：

```
s * v = (s * v.x, s * v.y)
```

**範例**：設定移動速率：
```
velocity = normalizedDirection * speed
```

#### 量值（長度） (Magnitude (Length))

向量的長度，透過勾股定理 (Pythagorean theorem) 計算：

```
|v| = sqrt(v.x^2 + v.y^2)
```

在 3D 中：
```
|v| = sqrt(v.x^2 + v.y^2 + v.z^2)
```

**最佳化**：當僅需比較距離（不需要實際值）時，使用平方量值以避免昂貴的平方根運算：

```
|v|^2 = x^2 + y^2
```

#### 標準化 (Normalization)

產生一個指向相同方向的單位向量（長度為 1）：

```
normalize(v) = v / |v| = (x / |v|, y / |v|)
```

標準化向量代表純粹的方向。一律先檢查 `|v| > 0` 再進行除法，以避免除以零。

**範例**：獲取實體面向的方向：
```
facing = normalize(target - self.position)
```

#### 內積 (Dot Product)

一個標量結果，編碼了兩個向量之間的角度關係：

```
a . b = a.x * b.x + a.y * b.y
```

在 3D 中：
```
a . b = a.x * b.x + a.y * b.y + a.z * b.z
```

幾何解釋：
```
a . b = |a| * |b| * cos(theta)
```

其中 `theta` 是向量之間的夾角。對於單位向量：
```
a . b = cos(theta)
```

關鍵特性：
- `a . b > 0`：向量指向大致相同的方向（夾角 < 90 度）。
- `a . b == 0`：向量垂直（夾角 = 90 度）。
- `a . b < 0`：向量指向大致相反的方向（夾角 > 90 度）。

**遊戲開發用途**：
- 視野檢查：玩家是否在敵人前方？
- 光照：計算漫射光強度 (`max(0, dot(normal, lightDir))`)。
- 投影：將一個向量投影到另一個向量上。

#### 外積 (3D) (Cross Product (3D))

產生一個同時垂直於兩個輸入向量的向量：

```
a x b = (
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
)
```

外積的量值等於：
```
|a x b| = |a| * |b| * sin(theta)
```

在 2D 中，「外積」是一個標量（3D 外積的 z 分量）：
```
a x b = a.x * b.y - a.y * b.x
```

**遊戲開發用途**：
- 確定繞行順序（順時針 vs 逆時針）。
- 計算光照所需的表面法線。
- 確定一個點是在線條的左側還是右側。

#### 垂直向量 (2D) (Perpendicular Vector (2D))

若要獲取與 `(x, y)` 垂直的向量：
```
perp = (-y, x)    // 逆時針旋轉 90 度
perp = (y, -x)    // 順時針旋轉 90 度
```

對於計算 2D 邊緣與牆壁的法線很有用。

#### 投影 (Projection)

將向量 `a` 投影到向量 `b` 上：

```
proj_b(a) = (a . b / b . b) * b
```

如果 `b` 已經是單位向量：
```
proj_b(a) = (a . b) * b
```

**遊戲開發用途**：
- 確定沿著表面法線的速度分量（用於彈跳/反射）。
- 沿牆壁滑動：從速度中減去法線方向的分量。

#### 反射 (Reflection)

將向量 `v` 對著法線為 `n`（`n` 是單位向量）的表面進行反射：

```
reflected = v - 2 * (v . n) * n
```

**遊戲開發用途**：
- 球體撞牆彈回。
- 光線反射計算。
- 跳彈軌跡。

### 虛擬程式碼 — Vector2D 類別 (Pseudocode -- Vector2D Class)

```
class Vector2D:
    x, y

    function add(other):
        return Vector2D(x + other.x, y + other.y)

    function subtract(other):
        return Vector2D(x - other.x, y - other.y)

    function scale(scalar):
        return Vector2D(x * scalar, y * scalar)

    function magnitude():
        return sqrt(x * x + y * y)

    function magnitudeSquared():
        return x * x + y * y

    function normalize():
        mag = magnitude()
        if mag > 0:
            return Vector2D(x / mag, y / mag)
        return Vector2D(0, 0)

    function dot(other):
        return x * other.x + y * other.y

    function cross(other):
        return x * other.y - y * other.x

    function perpendicular():
        return Vector2D(-y, x)

    function reflect(normal):
        d = dot(normal)
        return Vector2D(x - 2 * d * normal.x, y - 2 * d * normal.y)

    function angleTo(other):
        return acos(normalize().dot(other.normalize()))

    function distanceTo(other):
        return subtract(other).magnitude()

    function lerp(other, t):
        return Vector2D(
            x + (other.x - x) * t,
            y + (other.y - y) * t
        )
```

### 實際遊戲開發應用 (Practical Game Development Applications)

- **移動與轉向**：將速度向量加到位置上；標準化方向向量並乘以速率以獲得一致的移動。
- **距離檢查**：使用平方量值來進行效能友善的半徑檢查（例如：「此敵人在範圍內嗎？」）。
- **視野**：使用實體的前向向量與到目標方向向量之間的內積，來判斷目標是否在視野錐體內。
- **沿牆滑動**：將速度投影到牆壁的切線（垂直於法線）上，以允許沿著表面平滑滑動。
- **反射與彈跳**：當投射物或球體撞擊表面時，使用反射公式。
- **插值 (Interpolation)**：在兩個向量之間使用 `lerp`（線性插值）以實現平滑移動、相機追蹤以及動畫。
- **旋轉**：使用三角函數旋轉向量：
  ```
  rotated.x = v.x * cos(angle) - v.y * sin(angle)
  rotated.y = v.x * sin(angle) + v.y * cos(angle)
  ```

---

## 快速參考表 (Quick Reference Table)

| 演算法 / 概念 | 主要用途 | 複雜度 |
|---|---|---|
| Bresenham 線條 | 網格射線投射、視線 | 每條射線 O(max(dx, dy)) |
| AABB 重疊 | 快速碰撞偵測 | 每對 O(1) |
| 圓形重疊 | 圓形碰撞器偵測 | 每對 O(1) |
| 分離軸定理 | 凸多邊形碰撞 | 每對 O(n)（n 為邊數） |
| 空間雜湊 | 寬相碰撞剔除 | 平均查找時間 O(1) |
| 歐拉整合 | 簡單物理步進 | 每步每個物體 O(1) |
| 韋爾萊整合 | 以約束為基礎的物理 | 每步每個物體 O(1) |
| 衝量解決 | 碰撞反應 | O(反覆次數 * 接觸點數) |
| 向量標準化 | 方向擷取 | O(1) |
| 內積 | 角度/投影查詢 | O(1) |
| 外積 | 垂直性 / 繞行方向 | O(1) |
| 反射 | 彈跳 / 跳彈 | O(1) |
