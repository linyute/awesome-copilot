# REST、驗證、例外狀況對應器、OpenAPI

擴充功能：`quarkus-rest-jackson`（Quarkus REST + Jackson）、`quarkus-hibernate-validator`、`quarkus-smallrye-openapi`。在新程式碼中請勿與 `quarkus-resteasy*`（舊版）混用。

## 資源、驗證、例外狀況對應器（已在 3.40.1 與 3.27.6 上驗證）

```java
@Path("/greetings")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GreetingResource {
    public record GreetingRequest(@NotBlank @Size(max = 20) String name) {}
    public record Greeting(String message) {}
    public record ApiError(String code, String message) {}
    public static class NotFound extends RuntimeException { public NotFound(String m) { super(m); } }

    @Inject GreetingConfig config;            // package-private injection, no private

    @POST
    @Operation(summary = "Create a greeting")          // org.eclipse.microprofile.openapi.annotations
    public Greeting create(@Valid @NotNull GreetingRequest req) { return new Greeting(config.prefix() + " " + req.name()); }

    @GET @Path("/{name}")
    public Greeting get(@PathParam("name") String name) {
        if ("missing".equals(name)) throw new NotFound("no " + name);
        return new Greeting(config.prefix() + " " + name);
    }

    @ServerExceptionMapper                               // org.jboss.resteasy.reactive.server
    public RestResponse<ApiError> notFound(NotFound e) {
        return RestResponse.status(Response.Status.NOT_FOUND, new ApiError("NOT_FOUND", e.getMessage()));
    }
}
```

- 無效的請求本文會自動傳回 400 並附帶違規報告；`@NotNull` 也會使 JSON `null` 本文成為 400，因為 `@Valid` 會略過 null。測試：`given().contentType("application/json").body("{\"name\":\"\"}").post("/greetings")` 傳回 400。
- `@ServerExceptionMapper` 方法位於資源類別中（區域）或任何 CDI Bean 中（全域）。帶有 `@Provider` 的傳統 `ExceptionMapper<T>` 提供者亦可運作；偏好註釋形式。

## OpenAPI

`quarkus-smallrye-openapi` 在開發環境於 `/q/openapi`（加入 `?format=json`）與 `/q/swagger-ui` 提供 Swagger UI（已驗證：JSON 包含 `/greetings` 路徑）。透過 `quarkus.smallrye-openapi.info-title=...` 進行設定。僅在說明具有增值效益處新增註釋（`@Operation`、`@APIResponse`、`@Tag`）；結構描述會從 record 與資源方法自動推斷。

## 其他重點

- 內容交涉、多組件（Multipart）與 SSE 存在於 Quarkus REST 中（搭配 `@RestStreamElementType` 的 `Multi<T>`）；使用前請閱讀 https://quarkus.io/guides/rest 的 REST 指南。
- 橫切面關注點：使用 `@ServerRequestFilter` / `@ServerResponseFilter`（靜態或 CDI 方法）取代 JAX-RS 篩選器。
- CORS：`quarkus.http.cors.enabled=true` 與明確的 `quarkus.http.cors.origins`；正式環境請勿使用 `*`。
- 傳回 `Uni` 的方法在未加上 `@Blocking` 前切勿執行長時間阻斷作業；請參閱 `reactive-messaging.md`。
