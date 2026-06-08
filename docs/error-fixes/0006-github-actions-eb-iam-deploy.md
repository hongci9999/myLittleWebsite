# GitHub Actions EB 배포 IAM 권한 부족 (2026-06)

날짜: 2026-06-08

## 발생한 오류

Obsidian 유튜브 클립 AI 채우기를 프로덕션에 반영하려 `main` 푸시 후 GitHub Actions **Deploy to AWS**를 실행했으나, **프론트(S3·CloudFront)는 성공**하고 **API(Elastic Beanstalk) `update-environment`는 IAM 권한 부족으로 반복 실패**했다.

프로덕션 API는 구버전이 남아 `POST /api/column-scraps/ai-fill`에서 `youtubeClip` 없이 `url`만 검사하는 코드가 동작했고, 응답 `{"error":"url is required"}`(content-length 27)가 발생했다.

### EB 이벤트 타임라인 (2026-06-08, KST)

| 시각 | 유형 | 내용 |
|------|------|------|
| 10:45 | ERROR | `s3:GetObjectAcl` 거부 |
| 10:45 | ERROR | `cloudformation:DescribeStackResource` 거부 (`awseb-e-t8vcdg3t7c-stack`) |
| 10:59 | ERROR | `s3:GetBucketPolicy` 거부 |
| 10:59 | ERROR | `s3:DeleteObject` 거부 (`_runtime/_versions/.../gh-0b5b694-...`) |
| 11:06 | ERROR | `autoscaling:DescribeAutoScalingGroups` 거부 |
| 11:10 | ERROR | `ec2:DescribeLaunchTemplates` 거부 (비치명적) |
| 11:10 | INFO | `New application version was deployed to running EC2 instances.` |
| 11:10 | INFO | `Environment update completed successfully.` |

역할: `arn:aws:iam::661596276927:role/github-actions-mylittlewebsite-deploy`  
정책: 인라인 `deploy-github-minimal` (AWS 콘솔에서만 관리, 레포 코드 없음)

## 원인

| 단계 | 원인 |
|------|------|
| 증상(프론트 OK·API 구버전) | Actions가 `create-application-version`까지는 통과해도 **`update-environment` 미완료** → EB 인스턴스에 새 zip 미반영 |
| IAM 설계 | 초기 정책이 **프론트 S3·CloudFront 무효화** 중심. EB 배포 시 EB·S3 스테이징·CloudFormation·Auto Scaling·EC2 조회 권한이 단계적으로 필요했으나 누락 |
| 권한 추가 방식 | EB가 배포 단계마다 다른 AWS API를 호출해 **한 번에 최소 권한을 맞추기 어려움** → EB 이벤트·Actions 로그를 보며 `deploy-github-minimal`을 순차 보강 |
| `DescribeStackResource` vs `DescribeStackResources` | IAM 액션 이름이 다름. 복수형만 있으면 단수형 호출은 계속 거부 |
| `ec2:DescribeLaunchTemplates` | 배포 완료 직후 EB가 런치 템플릿을 조회. **배포 자체는 성공**했으나 로그에 ERROR 남음 |

관련: [0003](./0003-aws-eb-cloudfront-cors-deploy.md)(2026-05)에서도 `update-environment` 시 CloudFormation 권한 부족으로 Degraded가 발생한 전례가 있음.

## 수정 방법

### 1. 수정 위치

IAM → **역할** → `github-actions-mylittlewebsite-deploy` → 인라인 정책 **`deploy-github-minimal`** JSON 편집.  
새 역할을 만들 필요 없음.

### 2. 권한 보강 순서 (실제 해결 과정)

1. **EB S3 객체 ACL** — `EbArtifactObjects`에 `s3:GetObjectAcl`, `s3:PutObjectAcl` 추가  
2. **CloudFormation 단수형** — `CloudFormationForElasticBeanstalk`에 `cloudformation:DescribeStackResource` 추가 (`DescribeStackResources`와 별도)  
3. **EB S3 버킷·객체 정리** — `EbArtifactBucket`에 `s3:GetBucketPolicy`, `EbArtifactObjects`에 `s3:DeleteObject` 추가  
4. **Auto Scaling** — 새 Statement `AutoScalingForElasticBeanstalk` (`autoscaling:DescribeAutoScalingGroups` 등 또는 `autoscaling:*`)  
5. **(권장) EC2 조회** — 새 Statement `Ec2DescribeForElasticBeanstalk` (`ec2:DescribeLaunchTemplates` 등) — 11:10 배포는 이 오류에도 **성공**했으나 로그 정리용

### 3. 최종 권장 정책 구조 (참고)

아래는 2026-06-08 해결 시점 기준 **권한이 모인 형태**이다. 버킷·CloudFront ID는 계정 값 그대로 사용.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FrontendBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::mylittlewebsite-dev-661596276927-ap-northeast-2-an"
    },
    {
      "Sid": "FrontendBucketObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::mylittlewebsite-dev-661596276927-ap-northeast-2-an/*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::661596276927:distribution/EAV5ODYEOW4VD"
    },
    {
      "Sid": "EbArtifactBucket",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:GetBucketPolicy"
      ],
      "Resource": "arn:aws:s3:::elasticbeanstalk-ap-northeast-2-661596276927"
    },
    {
      "Sid": "EbArtifactObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectAcl",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::elasticbeanstalk-ap-northeast-2-661596276927/*"
    },
    {
      "Sid": "ElasticBeanstalkDeploy",
      "Effect": "Allow",
      "Action": "elasticbeanstalk:*",
      "Resource": "*"
    },
    {
      "Sid": "CloudFormationForElasticBeanstalk",
      "Effect": "Allow",
      "Action": [
        "cloudformation:GetTemplate",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResource",
        "cloudformation:DescribeStackResources",
        "cloudformation:DescribeStackEvents",
        "cloudformation:ListStackResources",
        "cloudformation:UpdateStack",
        "cloudformation:ValidateTemplate"
      ],
      "Resource": "arn:aws:cloudformation:ap-northeast-2:661596276927:stack/awseb-*/*"
    },
    {
      "Sid": "AutoScalingForElasticBeanstalk",
      "Effect": "Allow",
      "Action": "autoscaling:*",
      "Resource": "*"
    },
    {
      "Sid": "Ec2DescribeForElasticBeanstalk",
      "Effect": "Allow",
      "Action": "ec2:Describe*",
      "Resource": "*"
    }
  ]
}
```

### 4. 배포 재실행

1. IAM 정책 저장  
2. GitHub **Actions → Deploy to AWS → Re-run**  
3. EB 콘솔: Health **Ok/Green**, 실행 버전 `gh-<sha>-<run_id>-<attempt>` 확인  
4. 프로덕션에서 Obsidian 클립 AI 채우기 재테스트 (`url is required` 미발생 확인)

### 5. 디버깅 팁

- Actions 로그: `create-application-version` 성공 + `update-environment` 실패 → **IAM·EB 이벤트** 우선 확인  
- EB **Events** 탭이 거부된 **정확한 IAM 액션**을 알려 줌 → 해당 Statement에만 추가 (프론트 블록은 유지)  
- GitHub Variable `EB_S3_BUCKET`이 `elasticbeanstalk-ap-northeast-2-<account-id>`와 일치하는지 확인

## 결과/참고

- 2026-06-08 11:10 KST **환경 업데이트 성공**, `gh-0b5b694-27111404377-2` 등 최신 API 버전이 EC2에 배포됨.  
- `ec2:DescribeLaunchTemplates`는 배포 완료 후 ERROR로 남았으나 **업데이트 완료에는 영향 없음**. `ec2:Describe*` 추가 권장.  
- 워크플로: [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml)  
- CI/CD 개요: [learnings/0032](../learnings/0032-cicd-github-actions-aws.md)  
- 선행 유사 이슈: [0003](./0003-aws-eb-cloudfront-cors-deploy.md)  
- 트리거 기능: Obsidian 클립 AI — [learnings/0037](../learnings/0037-obsidian-youtube-clip-column-scrap.md), [ADR 0022](../decisions/0022-obsidian-youtube-clip-column-scrap.md)
