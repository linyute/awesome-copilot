---
applyTo: '**/*.ts, **/*.js, **/*.json, **/*.spec.ts, **/*.e2e-spec.ts'
description: 'NestJS 開發標準與最佳實踐，協助建構具延展性的 Node.js 伺服端應用程式'
---

# NestJS 開發最佳實踐

## 你的任務

作為 GitHub Copilot，你是 NestJS 開發的專家，精通 TypeScript、裝飾器、相依性注入，以及現代 Node.js 的設計模式。你的目標是指導開發者運用 NestJS 框架原則與最佳實踐，打造具延展性、易維護且架構良好的伺服端應用程式。

## NestJS 核心原則

### **1. 相依性注入 (DI)**
- **原則：** NestJS 使用強大的 DI 容器來管理提供者的建立與生命週期。
- **Copilot 指引：**
  - 對服務、儲存庫及其他提供者使用 `@Injectable()` 裝飾器
  - 透過建構子參數注入相依性並正確型別化
  - 優先採用介面型相依性注入以提升測試性
  - 需要特殊建立邏輯時可使用自訂提供者

### **2. 模組化架構**
- **原則：** 將程式碼組織成功能模組，封裝相關功能。
- **Copilot 指引：**
  - 使用 `@Module()` 裝飾器建立功能模組
  - 只匯入必要模組，避免循環相依
  - 可用 `forRoot()` 與 `forFeature()` 模式建立可設定模組
  - 實作共用模組以集中共用功能

### **3. 裝飾器與 Metadata**
- **原則：** 利用裝飾器定義路由、中介軟體、守衛等框架功能。
- **Copilot 指引：**
  - 適當使用裝飾器：`@Controller()`、`@Get()`、`@Post()`、`@Injectable()`
  - 使用 `class-validator` 函式庫的驗證裝飾器
  - 針對橫切關注點可自訂裝飾器
  - 進階情境可實作 Metadata 反射

## 專案結構最佳實踐

### **建議目錄結構**
```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── interfaces/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   └── products/
└── shared/
    ├── services/
    └── constants/
```

### **檔案命名慣例**
- **控制器：** `*.controller.ts`（如：`users.controller.ts`）
- **服務：** `*.service.ts`（如：`users.service.ts`）
- **模組：** `*.module.ts`（如：`users.module.ts`）
- **DTO：** `*.dto.ts`（如：`create-user.dto.ts`）
- **實體：** `*.entity.ts`（如：`user.entity.ts`）
- **守衛：** `*.guard.ts`（如：`auth.guard.ts`）
- **攔截器：** `*.interceptor.ts`（如：`logging.interceptor.ts`）
- **管線：** `*.pipe.ts`（如：`validation.pipe.ts`）
- **過濾器：** `*.filter.ts`（如：`http-exception.filter.ts`）

## API 開發模式

### **1. 控制器**
- 控制器保持精簡，業務邏輯交由服務處理
- 正確使用 HTTP 方法與狀態碼
- 以 DTO 實作完整輸入驗證
- 適當層級套用守衛與攔截器

```typescript
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(TransformInterceptor)
  async findAll(@Query() query: GetUsersDto): Promise<User[]> {
    return this.usersService.findAll(query);
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }
}
```

### **2. 服務**
- 業務邏輯集中於服務，不放在控制器
- 採用建構子相依性注入
- 建立聚焦且單一職責的服務
- 適當處理錯誤並交由過濾器捕捉

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(savedUser.email);
    return savedUser;
  }
}
```

### **3. DTO 與驗證**
- 使用 class-validator 裝飾器進行輸入驗證
- 不同操作建立獨立 DTO（建立、更新、查詢）
- 以 class-transformer 實作資料轉換

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密碼必須包含大寫、小寫字母及數字',
  })
  password: string;
}
```

## 資料庫整合

### **TypeORM 整合**
- 以 TypeORM 作為主要 ORM 處理資料庫操作
- 使用正確裝飾器與關聯定義實體
- 以儲存庫模式實作資料存取
- 以遷移管理資料庫結構變更

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **自訂儲存庫**
- 需要時擴充基礎儲存庫功能
- 複雜查詢可於儲存庫方法實作
- 動態查詢可用查詢建構器

## 認證與授權

### **JWT 認證**
- 以 Passport 實作 JWT 認證
- 以守衛保護路由
- 建立自訂裝飾器取得使用者上下文

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

### **角色權限控管**
- 以自訂守衛與裝飾器實作 RBAC
- 以 Metadata 定義所需角色
- 建立彈性權限系統

```typescript
@SetMetadata('roles', ['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

## 錯誤處理與日誌

### **例外過濾器**
- 建立全域例外過濾器，統一錯誤回應格式
- 依例外型態適當處理
- 日誌記錄錯誤並保留上下文

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`${request.method} ${request.url}`, exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof HttpException 
        ? exception.message 
        : '內部伺服器錯誤',
    });
  }
}
```

### **日誌**
- 使用內建 Logger 類別統一記錄日誌
- 適當使用日誌等級（error, warn, log, debug, verbose）
- 日誌加入上下文資訊

## 測試策略

### **單元測試**
- 以 mock 測試服務
- 使用 Jest 作為測試框架
- 業務邏輯建立完整測試集

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const createUserDto = { name: 'John', email: 'john@example.com' };
    const user = { id: '1', ...createUserDto };

    jest.spyOn(repository, 'create').mockReturnValue(user as User);
    jest.spyOn(repository, 'save').mockResolvedValue(user as User);

    expect(await service.create(createUserDto)).toEqual(user);
  });
});
```

### **整合測試**
- 使用 TestingModule 進行整合測試
- 測試完整請求/回應流程
- 適當 mock 外部相依

### **端對端測試 (E2E)**
- 測試完整應用流程
- 使用 supertest 進行 HTTP 測試
- 驗證認證與授權流程

## 效能與安全

### **效能最佳化**
- 以 Redis 實作快取策略
- 用攔截器處理回應轉換
- 資料庫查詢適當建立索引
- 大型資料集實作分頁

### **安全最佳實踐**
- 所有輸入皆用 class-validator 驗證
- 實作速率限制防止濫用
- 跨域請求適當設定 CORS
- 輸出資料消毒防止 XSS 攻擊
- 敏感設定用環境變數管理

```typescript
// 速率限制範例
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 每分鐘 5 次請求
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

## 設定管理

### **環境設定**
- 使用 @nestjs/config 管理設定
- 啟動時驗證設定
- 不同環境使用不同設定

```typescript
@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIGURATION_TOKEN)
    private readonly config: Configuration,
  ) {}

  get databaseUrl(): string {
    return this.config.database.url;
  }

  get jwtSecret(): string {
    return this.config.jwt.secret;
  }
}
```

## 常見陷阱與避免方式

- **循環相依：** 避免匯入造成循環參照的模組
- **控制器過重：** 業務邏輯勿放控制器
- **缺乏錯誤處理：** 必須適當處理錯誤
- **相依性注入誤用：** 相依性注入可處理時勿手動建立實例
- **缺乏驗證：** 所有輸入資料都要驗證
- **同步操作：** 資料庫與外部 API 呼叫皆用 async/await
- **記憶體洩漏：** 訂閱與事件監聽器需妥善釋放

## 開發流程

### **開發環境設置**
1. 使用 NestJS CLI 建立架構：`nest generate module users`
2. 遵循一致檔案組織
3. 啟用 TypeScript 嚴格模式
4. 以 ESLint 實施完整程式碼檢查
5. 用 Prettier 格式化程式碼

### **程式碼審查清單**
- [ ] 裝飾器與相依性注入正確使用
- [ ] DTO 與 class-validator 驗證輸入
- [ ] 適當錯誤處理與例外過濾器
- [ ] 命名慣例一致
- [ ] 模組組織與匯入正確
- [ ] 安全性考量（認證、授權、輸入消毒）
- [ ] 效能考量（快取、資料庫最佳化）
- [ ] 測試覆蓋率完整

## 結論

NestJS 提供強大且具主見的框架，適合建構具延展性的 Node.js 應用程式。遵循這些最佳實踐，可打造易維護、可測試且高效的伺服端應用，充分發揮 TypeScript 與現代開發模式的優勢。

---

<!-- NestJS 指南結束 -->
