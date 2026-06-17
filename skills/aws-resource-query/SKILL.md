---
name: aws-resource-query
description: '使用自然語言查詢 AWS 資源。涵蓋 EC2, S3, RDS, Lambda, ECS, EKS, Secrets Manager, IAM, VPC, 網路, 訊息傳遞等。嚴格僅限唯讀 — 無寫入、刪除或變更操作。'
---

# AWS 資源查詢 (AWS Resource Query)

透過將意圖轉換為唯讀的 AWS CLI 命令，回答關於 AWS 資源的自然語言問題。此技能 **絕不** 執行建立、修改或刪除資源的命令。

## 安全合約

**嚴格僅限唯讀。** 此技能排他性地使用：
- `aws <service> describe-*`
- `aws <service> list-*`
- `aws <service> get-*`
- `aws sts get-caller-identity`
- `aws configure get`
- `aws resourcegroupstaggingapi get-resources`
- `aws ce get-*`
- `aws support describe-*`

無論使用者提出什麼要求，**絕不** 執行以下任何操作：
`create-*`, `run-*`, `start-*`, `stop-*`, `reboot-*`, `delete-*`, `terminate-*`, `put-*`, `update-*`, `modify-*`, `attach-*`, `detach-*`, `send-*`, `publish-*`, `invoke-*`, `execute-*`

如果使用者的查詢暗示了寫入操作，請回應：
> 「此技能為唯讀。我可以向您展示 [資源] 的目前狀態，但我無法 [建立/修改/刪除] 它。您想查看目前存在的內容嗎？」

## 工作流程

### 第 1 步：解析意圖
識別：目標服務、範圍（全部 / 已過濾 / 特定）、詳細程度和區域。

### 第 2 步：確認帳戶與區域
```bash
aws sts get-caller-identity --query '{Account:Account,UserId:UserId}'
aws configure get region
```
當使用者指定區域時，在所有命令後附加 `--region <region>`。

### 第 3 步：執行與格式化
執行下方匹配的唯讀命令，並將結果格式化為易讀的表格。對於大型結果集，先顯示計數並提議進一步過濾。

---

## 意圖 → 命令映射

### 運算 (COMPUTE)

#### EC2 執行個體 (Instances)
```bash
# "列出 EC2 執行個體" / "顯示我的 VM" / "有哪些執行個體在運行"
aws ec2 describe-instances \
  --query 'Reservations[].Instances[].[InstanceId,InstanceType,State.Name,Tags[?Key==`Name`].Value|[0],PrivateIpAddress,PublicIpAddress]' \
  --output table

# "僅限運行中的執行個體"
aws ec2 describe-instances --filters Name=instance-state-name,Values=running \
  --query 'Reservations[].Instances[].[InstanceId,InstanceType,Tags[?Key==`Name`].Value|[0],PrivateIpAddress]' \
  --output table

# "已停止的執行個體"
aws ec2 describe-instances --filters Name=instance-state-name,Values=stopped \
  --query 'Reservations[].Instances[].[InstanceId,InstanceType,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# "使用中的執行個體類型"
aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceType' --output text | sort | uniq -c | sort -rn

# "自動縮放群組" / "ASGs"
aws autoscaling describe-auto-scaling-groups \
  --query 'AutoScalingGroups[].[AutoScalingGroupName,MinSize,MaxSize,DesiredCapacity]' --output table

# "彈性 IP" / "EIPs"
aws ec2 describe-addresses \
  --query 'Addresses[].[PublicIp,InstanceId,AllocationId,AssociationId]' --output table

# "金鑰對" (Key pairs)
aws ec2 describe-key-pairs \
  --query 'KeyPairs[].[KeyName,CreateTime]' --output table

# "我擁有的 AMI"
aws ec2 describe-images --owners self \
  --query 'Images[].[ImageId,Name,CreationDate,State]' --output table

# "Spot 執行個體"
aws ec2 describe-spot-instance-requests \
  --query 'SpotInstanceRequests[].[SpotInstanceRequestId,State,InstanceId,LaunchSpecification.InstanceType]' --output table
```

#### Lambda 函數
```bash
# "列出 Lambda 函數" / "顯示無伺服器函數"
aws lambda list-functions \
  --query 'Functions[].[FunctionName,Runtime,MemorySize,Timeout,LastModified]' --output table

# "<名稱> 的 Lambda 函數詳情"
aws lambda get-function-configuration --function-name <name>

# "Lambda 事件源映射" / "Lambda 觸發器"
aws lambda list-event-source-mappings \
  --query 'EventSourceMappings[].[FunctionArn,EventSourceArn,State,BatchSize]' --output table

# "Lambda 層" (Layers)
aws lambda list-layers \
  --query 'Layers[].[LayerName,LatestMatchingVersion.LayerVersionArn]' --output table

# "<名稱> 的 Lambda 並行性"
aws lambda get-function-concurrency --function-name <name>
```

#### ECS
```bash
# "ECS 叢集"
aws ecs list-clusters --query 'clusterArns' --output table

# "ECS 叢集詳情"
aws ecs describe-clusters \
  --clusters $(aws ecs list-clusters --query 'clusterArns[]' --output text) \
  --query 'clusters[].[clusterName,status,runningTasksCount,activeServicesCount]' --output table

# "<叢集> 中的 ECS 服務"
aws ecs describe-services --cluster <cluster> \
  --services $(aws ecs list-services --cluster <cluster> --query 'serviceArns[]' --output text) \
  --query 'services[].[serviceName,status,runningCount,desiredCount]' --output table

# "ECS 任務定義" (Task definitions)
aws ecs list-task-definitions --query 'taskDefinitionArns' --output table
```

#### EKS
```bash
# "EKS 叢集" / "Kubernetes 叢集"
aws eks list-clusters --query 'clusters' --output table

# "<名稱> 的 EKS 叢集詳情"
aws eks describe-cluster --name <name> \
  --query 'cluster.[name,status,version,endpoint]'

# "<叢集> 的 EKS 節點群組"
aws eks list-nodegroups --cluster-name <name> --query 'nodegroups' --output table

# "<叢集> 的 EKS 附加元件" (Add-ons)
aws eks list-addons --cluster-name <name> --query 'addons' --output table
```

#### 其他運算資源
```bash
# "Beanstalk 環境"
aws elasticbeanstalk describe-environments \
  --query 'Environments[].[EnvironmentName,ApplicationName,Status,Health]' --output table

# "Batch 作業隊列"
aws batch describe-job-queues \
  --query 'jobQueues[].[jobQueueName,state,status,priority]' --output table

# "Batch 運算環境"
aws batch describe-compute-environments \
  --query 'computeEnvironments[].[computeEnvironmentName,type,state,status]' --output table
```

---

### 儲存 (STORAGE)

#### S3
```bash
# "列出 S3 儲存桶" / "顯示我的儲存桶"
aws s3api list-buckets --query 'Buckets[].[Name,CreationDate]' --output table

# "<名稱> 的 S3 儲存桶加密"
aws s3api get-bucket-encryption --bucket <name>

# "<名稱> 的 S3 儲存桶版本控制"
aws s3api get-bucket-versioning --bucket <name>

# "<名稱> 的 S3 公共訪問設定"
aws s3api get-public-access-block --bucket <name>

# "<名稱> 的 S3 生命週期規則"
aws s3api get-bucket-lifecycle-configuration --bucket <name>

# "<名稱> 的 S3 儲存桶策略"
aws s3api get-bucket-policy --bucket <name>

# "列出 s3://<bucket>/<prefix> 中的物件"
aws s3api list-objects-v2 --bucket <bucket> --prefix <prefix> \
  --query 'Contents[].[Key,Size,LastModified,StorageClass]' --output table
```

#### EBS & EFS
```bash
# "EBS 磁碟區" / "列出磁碟區"
aws ec2 describe-volumes \
  --query 'Volumes[].[VolumeId,Size,VolumeType,State,AvailabilityZone,Attachments[0].InstanceId]' --output table

# "未掛載的 EBS 磁碟區" / "未使用的磁碟區"
aws ec2 describe-volumes --filters Name=status,Values=available \
  --query 'Volumes[].[VolumeId,Size,VolumeType,CreateTime]' --output table

# "我擁有的 EBS 快照"
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[].[SnapshotId,VolumeId,State,StartTime]' --output table

# "EFS 檔案系統"
aws efs describe-file-systems \
  --query 'FileSystems[].[FileSystemId,Name,LifeCycleState,SizeInBytes.Value,ThroughputMode]' --output table
```

---

### 資料庫 (DATABASES)

#### RDS
```bash
# "列出 RDS 執行個體" / "顯示資料庫" / "我有什麼資料庫"
aws rds describe-db-instances \
  --query 'DBInstances[].[DBInstanceIdentifier,DBInstanceClass,Engine,EngineVersion,DBInstanceStatus,MultiAZ,Endpoint.Address]' \
  --output table

# "Aurora 叢集" / "RDS 叢集"
aws rds describe-db-clusters \
  --query 'DBClusters[].[DBClusterIdentifier,Engine,EngineVersion,Status,MultiAZ,Endpoint]' --output table

# "RDS 快照"
aws rds describe-db-snapshots \
  --query 'DBSnapshots[].[DBSnapshotIdentifier,DBInstanceIdentifier,Engine,Status,SnapshotCreateTime]' --output table

# "RDS 參數群組"
aws rds describe-db-parameter-groups \
  --query 'DBParameterGroups[].[DBParameterGroupName,DBParameterGroupFamily]' --output table

# "RDS 子網路群組"
aws rds describe-db-subnet-groups \
  --query 'DBSubnetGroups[].[DBSubnetGroupName,VpcId]' --output table
```

#### DynamoDB
```bash
# "DynamoDB 資料表" / "列出 NoSQL 資料表"
aws dynamodb list-tables --query 'TableNames' --output table

# "<名稱> 的 DynamoDB 資料表詳情"
aws dynamodb describe-table --table-name <name> \
  --query 'Table.[TableName,TableStatus,ItemCount,BillingModeSummary.BillingMode]'

# "DynamoDB 備份"
aws dynamodb list-backups \
  --query 'BackupSummaries[].[TableName,BackupName,BackupStatus,BackupCreationDateTime]' --output table

# "DynamoDB 全球資料表"
aws dynamodb list-global-tables \
  --query 'GlobalTables[].[GlobalTableName,ReplicationGroup[].RegionName]' --output table
```

#### ElastiCache & Redshift
```bash
# "ElastiCache 叢集" / "Redis 叢集"
aws elasticache describe-cache-clusters \
  --query 'CacheClusters[].[CacheClusterId,Engine,EngineVersion,CacheNodeType,CacheClusterStatus]' --output table

# "ElastiCache 複寫群組"
aws elasticache describe-replication-groups \
  --query 'ReplicationGroups[].[ReplicationGroupId,Status,AutomaticFailover]' --output table

# "Redshift 叢集" / "資料倉儲"
aws redshift describe-clusters \
  --query 'Clusters[].[ClusterIdentifier,ClusterStatus,NodeType,NumberOfNodes,Endpoint.Address]' --output table

# "DocumentDB 叢集"
aws docdb describe-db-clusters \
  --query 'DBClusters[].[DBClusterIdentifier,Status,Engine,Endpoint]' --output table

# "Neptune 叢集" / "圖形資料庫"
aws neptune describe-db-clusters \
  --query 'DBClusters[].[DBClusterIdentifier,Status,Engine,Endpoint]' --output table
```

---

### 網路 (NETWORKING)

#### VPC & 子網路 (Subnets)
```bash
# "列出 VPC" / "顯示我的 VPC"
aws ec2 describe-vpcs \
  --query 'Vpcs[].[VpcId,CidrBlock,IsDefault,Tags[?Key==`Name`].Value|[0],State]' --output table

# "子網路" / "列出子網路"
aws ec2 describe-subnets \
  --query 'Subnets[].[SubnetId,VpcId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' --output table

# "公共子網路"
aws ec2 describe-subnets --filters "Name=mapPublicIpOnLaunch,Values=true" \
  --query 'Subnets[].[SubnetId,VpcId,CidrBlock,AvailabilityZone]' --output table

# "安全群組" (Security groups)
aws ec2 describe-security-groups \
  --query 'SecurityGroups[].[GroupId,GroupName,VpcId,Description]' --output table

# "<群組識別碼> 的安全群組規則"
aws ec2 describe-security-group-rules --filters "Name=group-id,Values=<id>" \
  --query 'SecurityGroupRules[].[IsEgress,IpProtocol,FromPort,ToPort,CidrIpv4,Description]' --output table

# "路由表" (Route tables)
aws ec2 describe-route-tables \
  --query 'RouteTables[].[RouteTableId,VpcId,Associations[0].SubnetId,Tags[?Key==`Name`].Value|[0]]' --output table

# "網際網路閘道" / "IGWs"
aws ec2 describe-internet-gateways \
  --query 'InternetGateways[].[InternetGatewayId,Attachments[0].VpcId,Tags[?Key==`Name`].Value|[0]]' --output table

# "NAT 閘道"
aws ec2 describe-nat-gateways \
  --query 'NatGateways[].[NatGatewayId,VpcId,SubnetId,State,NatGatewayAddresses[0].PublicIp]' --output table

# "VPC 端點" (VPC endpoints)
aws ec2 describe-vpc-endpoints \
  --query 'VpcEndpoints[].[VpcEndpointId,VpcId,ServiceName,State,VpcEndpointType]' --output table

# "VPC 對等互連連線" (VPC peering)
aws ec2 describe-vpc-peering-connections \
  --query 'VpcPeeringConnections[].[VpcPeeringConnectionId,Status.Code,RequesterVpcInfo.VpcId,AccepterVpcInfo.VpcId]' --output table

# "NACLs" / "網路 ACL"
aws ec2 describe-network-acls \
  --query 'NetworkAcls[].[NetworkAclId,VpcId,IsDefault]' --output table

# "Transit Gateways"
aws ec2 describe-transit-gateways \
  --query 'TransitGateways[].[TransitGatewayId,State,Description]' --output table
```

#### 負載平衡器 (Load Balancers) & DNS
```bash
# "負載平衡器" / "ALBs" / "NLBs"
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[].[LoadBalancerName,Type,Scheme,State.Code,DNSName]' --output table

# "目標群組" (Target groups)
aws elbv2 describe-target-groups \
  --query 'TargetGroups[].[TargetGroupName,Protocol,Port,TargetType,VpcId]' --output table

# "<目標群組 ARN> 的目標運作狀態"
aws elbv2 describe-target-health --target-group-arn <arn> \
  --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State,TargetHealth.Description]' --output table

# "Route 53 託管區域" / "DNS 區域"
aws route53 list-hosted-zones \
  --query 'HostedZones[].[Id,Name,Config.PrivateZone,ResourceRecordSetCount]' --output table

# "區域 <識別碼> 中的 DNS 記錄"
aws route53 list-resource-record-sets --hosted-zone-id <id> \
  --query 'ResourceRecordSets[].[Name,Type,TTL]' --output table

# "CloudFront 分發" (Distributions)
aws cloudfront list-distributions \
  --query 'DistributionList.Items[].[Id,DomainName,Status,Origins.Items[0].DomainName]' --output table

# "VPN 連線"
aws ec2 describe-vpn-connections \
  --query 'VpnConnections[].[VpnConnectionId,State,Type,CustomerGatewayId]' --output table

# "Direct Connect 連線"
aws directconnect describe-connections \
  --query 'connections[].[connectionId,connectionName,connectionState,bandwidth]' --output table
```

---

### 安全與身分 (SECURITY & IDENTITY)

#### IAM
```bash
# "IAM 使用者" / "列出使用者"
aws iam list-users \
  --query 'Users[].[UserName,UserId,CreateDate,PasswordLastUsed]' --output table

# "IAM 角色" / "列出角色"
aws iam list-roles \
  --query 'Roles[].[RoleName,RoleId,CreateDate]' --output table

# "附加到角色 <名稱> 的 IAM 策略"
aws iam list-attached-role-policies --role-name <name> \
  --query 'AttachedPolicies[].[PolicyName,PolicyArn]' --output table

# "IAM 群組"
aws iam list-groups \
  --query 'Groups[].[GroupName,GroupId,CreateDate]' --output table

# "IAM 策略 (客戶管理)"
aws iam list-policies --scope Local \
  --query 'Policies[].[PolicyName,AttachmentCount,CreateDate]' --output table

# "誰啟用了 MFA" / "MFA 裝置"
aws iam list-virtual-mfa-devices \
  --query 'VirtualMFADevices[].[SerialNumber,User.UserName,EnableDate]' --output table

# "IAM 帳戶密碼策略"
aws iam get-account-password-policy

# "IAM 帳戶摘要"
aws iam get-account-summary
```

#### Secrets Manager
```bash
# "列出秘密" / "Secrets Manager 秘密" / "顯示秘密"
aws secretsmanager list-secrets \
  --query 'SecretList[].[Name,ARN,LastChangedDate,LastAccessedDate,Description]' --output table

# "<名稱> 的秘密元數據"
aws secretsmanager describe-secret --secret-id <name> \
  --query '{Name:Name,ARN:ARN,RotationEnabled:RotationEnabled,LastRotatedDate:LastRotatedDate,Tags:Tags}'

# "啟用了輪換的秘密"
aws secretsmanager list-secrets \
  --query 'SecretList[?RotationEnabled==`true`].[Name,LastRotatedDate]' --output table
```

> ⚠️ **注意**: 絕不檢索秘密的 **數值** (排除 `get-secret-value`)。僅顯示元數據。

#### SSM Parameter Store
```bash
# "SSM 參數" / "Parameter Store"
aws ssm describe-parameters \
  --query 'Parameters[].[Name,Type,LastModifiedDate,Description]' --output table

# "按路徑 <路徑> 查詢 SSM 參數"
aws ssm describe-parameters \
  --parameter-filters "Key=Path,Values=<path>" \
  --query 'Parameters[].[Name,Type,LastModifiedDate]' --output table
```

> ⚠️ **注意**: 絕不檢索參數的 **數值** (排除 `get-parameter`)。僅顯示元數據。

#### KMS & 證書 (Certificates)
```bash
# "KMS 金鑰" / "加密金鑰"
aws kms list-keys --query 'Keys[].[KeyId,KeyArn]' --output table

# "<識別碼> 的 KMS 金鑰詳情"
aws kms describe-key --key-id <id> \
  --query 'KeyMetadata.[KeyId,Description,KeyState,KeyUsage,CreationDate,Enabled]'

# "KMS 別名" (Aliases)
aws kms list-aliases \
  --query 'Aliases[].[AliasName,AliasArn,TargetKeyId]' --output table

# "SSL 證書" / "ACM 證書"
aws acm list-certificates \
  --query 'CertificateSummaryList[].[CertificateArn,DomainName,Status,RenewalEligibility]' --output table

# "<ARN> 的證書詳情"
aws acm describe-certificate --certificate-arn <arn> \
  --query 'Certificate.[DomainName,Status,NotAfter,NotBefore,InUseBy]'
```

#### GuardDuty, Security Hub & Config
```bash
# "GuardDuty 偵測器" (Detectors)
aws guardduty list-detectors --query 'DetectorIds' --output table

# "GuardDuty 發現結果" (Findings)
aws guardduty list-findings --detector-id <id> --query 'FindingIds' --output table

# "Security Hub 發現結果"
aws securityhub get-findings \
  --query 'Findings[].[Title,Severity.Label,WorkflowState,UpdatedAt]' --output table

# "AWS Config 規則"
aws configservice describe-config-rules \
  --query 'ConfigRules[].[ConfigRuleName,ConfigRuleState,Source.SourceIdentifier]' --output table

# "不合規資源" (Non-compliant resources)
aws configservice get-compliance-summary-by-config-rule \
  --query 'ComplianceSummariesByConfigRule[].[ConfigRuleName,Compliance.ComplianceType]' --output table
```

---

### 訊息傳遞與事件 (MESSAGING & EVENTS)

```bash
# "SQS 隊列" / "列出隊列"
aws sqs list-queues --query 'QueueUrls' --output table

# "<URL> 的 SQS 隊列詳情 / 訊息計數"
aws sqs get-queue-attributes --queue-url <url> \
  --attribute-names ApproximateNumberOfMessages,ApproximateNumberOfMessagesNotVisible,ApproximateAgeOfOldestMessage

# "SNS 主題" (Topics)
aws sns list-topics --query 'Topics[].TopicArn' --output table

# "SNS 訂閱" (Subscriptions)
aws sns list-subscriptions \
  --query 'Subscriptions[].[SubscriptionArn,Protocol,Endpoint,TopicArn]' --output table

# "EventBridge 規則"
aws events list-rules \
  --query 'Rules[].[Name,State,ScheduleExpression,EventPattern]' --output table

# "EventBridge 事件匯流排" (Event buses)
aws events list-event-buses \
  --query 'EventBuses[].[Name,Arn]' --output table

# "Kinesis 串流" (Streams)
aws kinesis list-streams --query 'StreamNames' --output table

# "Kinesis Firehose 傳遞串流"
aws firehose list-delivery-streams --query 'DeliveryStreamNames' --output table
```

---

### API GATEWAY & 無伺服器 (SERVERLESS)

```bash
# "API Gateway APIs" / "REST APIs"
aws apigateway get-rest-apis \
  --query 'items[].[id,name,description,createdDate]' --output table

# "HTTP APIs" / "API Gateway v2"
aws apigatewayv2 get-apis \
  --query 'Items[].[ApiId,Name,ProtocolType,ApiEndpoint,CreatedDate]' --output table

# "Step Functions 狀態機" / "工作流"
aws stepfunctions list-state-machines \
  --query 'stateMachines[].[name,stateMachineArn,type,creationDate]' --output table

# "<ARN> 的 Step Functions 執行記錄"
aws stepfunctions list-executions --state-machine-arn <arn> \
  --query 'executions[].[name,status,startDate,stopDate]' --output table
```

---

### 監控與觀測性 (MONITORING & OBSERVABILITY)

```bash
# "CloudWatch 警報" / "列出警報"
aws cloudwatch describe-alarms \
  --query 'MetricAlarms[].[AlarmName,StateValue,MetricName,Namespace,Threshold]' --output table

# "處於 ALARM 狀態的警報" / "觸發的警報"
aws cloudwatch describe-alarms --state-value ALARM \
  --query 'MetricAlarms[].[AlarmName,MetricName,StateReason]' --output table

# "CloudWatch 儀表板"
aws cloudwatch list-dashboards \
  --query 'DashboardEntries[].[DashboardName,LastModified,Size]' --output table

# "CloudWatch 紀錄群組" (Log groups)
aws logs describe-log-groups \
  --query 'logGroups[].[logGroupName,retentionInDays,storedBytes]' --output table

# "CloudTrail 追蹤" (Trails)
aws cloudtrail describe-trails \
  --query 'trailList[].[Name,S3BucketName,IsMultiRegionTrail,LogFileValidationEnabled]' --output table

# "ECR 儲存庫" / "容器登錄" (Container registries)
aws ecr describe-repositories \
  --query 'repositories[].[repositoryName,repositoryUri,createdAt]' --output table
```

---

### 成本與計費 (COST & BILLING)

```bash
# "本月成本" / "我花了多少錢"
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY --metrics BlendedCost \
  --query 'ResultsByTime[].[TimePeriod.Start,Total.BlendedCost.Amount,Total.BlendedCost.Unit]' \
  --output table

# "按服務分類成本" / "支出細目"
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE --output table

# "AWS 預算" (Budgets)
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --query 'Budgets[].[BudgetName,BudgetType,BudgetLimit.Amount,CalculatedSpend.ActualSpend.Amount]' \
  --output table

# "Trusted Advisor 建議"
aws support describe-trusted-advisor-checks --language en \
  --query 'checks[].[id,name,category]' --output table
```

---

### 跨服務查詢

```bash
# "標記為 Environment=production 的資源" / "所有生產資源"
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Environment,Values=production \
  --query 'ResourceTagMappingList[].[ResourceARN]' --output table

# "所有標記為 <金鑰>=<數值> 的資源"
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=<key>,Values=<value> \
  --query 'ResourceTagMappingList[].[ResourceARN,Tags]' --output table

# "所有資源的清單" (AWS Config)
aws configservice list-discovered-resources --resource-type <type> \
  --query 'resourceIdentifiers[].[resourceType,resourceId,resourceName]' --output table
```

---

## 輸出格式規則

1. 列表結果始終使用 `--output table`；僅在明確要求深度詳情時使用 `--output json`
2. 始終使用 `--query` 僅提取相關欄位 — 絕不傾倒原始 JSON
3. 對於大型結果集 (>20 項)，先顯示計數，然後提議過濾
4. 當命令未返回任何內容時，解釋原因（區域錯誤、無資源、權限不足）
5. 提議深入了解特定資源：「找到 47 個 EC2 執行個體。按狀態、類型或標籤過濾？」

## 錯誤處理

| 錯誤 | 回應 |
|---|---|
| `AccessDenied` | 「您無權列出 [資源]。需要：`<service>:<Action>`。」 |
| `NoCredentialProviders` | 「執行 `aws configure` 或設定 `AWS_PROFILE`。」 |
| 空結果 | 「在 [區域] 中未找到 [資源]。檢查另一個區域？」 |
| 無效的識別碼 | 「找不到『[名稱]』。請檢查名稱或提供資源識別碼。」 |
