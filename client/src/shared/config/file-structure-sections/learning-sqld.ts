/**
 * SQLD 학습 섹션 (자동 생성)
 * scripts/build-learning-config.mjs → public/learnings/SQLD 스캔
 * 수동 수정 시 다음 빌드에서 덮어쓰임
 */
import type { FileStructureSection } from '../file-structure'

const sqldSection: FileStructureSection = {
  "sectionId": "sqld",
  "sectionLabel": "SQLD",
  "basePath": "/learnings/SQLD",
  "nodes": [
    {
      "id": "01_데이터_모델링의_이해",
      "name": "데이터 모델링의 이해",
      "description": "ERD, 정규화, 식별자 등 (1과목)",
      "docs": [
        {
          "slug": "01_모델링_개념과_단계",
          "title": "01_모델링_개념과_단계",
          "filePath": "01_데이터_모델링의_이해/01_모델링_개념과_단계.md"
        },
        {
          "slug": "02_ERD_표기와_작성순서_ANSI_SPARC",
          "title": "02_ERD_표기와_작성순서_ANSI_SPARC",
          "filePath": "01_데이터_모델링의_이해/02_ERD_표기와_작성순서_ANSI_SPARC.md"
        },
        {
          "slug": "03_엔터티_정의와_분류",
          "title": "03_엔터티_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/03_엔터티_정의와_분류.md"
        },
        {
          "slug": "04_엔터티_분류_유무형과_발생시점",
          "title": "04_엔터티_분류_유무형과_발생시점",
          "filePath": "01_데이터_모델링의_이해/04_엔터티_분류_유무형과_발생시점.md"
        },
        {
          "slug": "05_속성_정의와_분류",
          "title": "05_속성_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/05_속성_정의와_분류.md"
        },
        {
          "slug": "06_도메인과_관계",
          "title": "06_도메인과_관계",
          "filePath": "01_데이터_모델링의_이해/06_도메인과_관계.md"
        },
        {
          "slug": "07_교차_엔터티와_관계_체크사항",
          "title": "07_교차_엔터티와_관계_체크사항",
          "filePath": "01_데이터_모델링의_이해/07_교차_엔터티와_관계_체크사항.md"
        },
        {
          "slug": "08_식별자_정의와_분류",
          "title": "08_식별자_정의와_분류",
          "filePath": "01_데이터_모델링의_이해/08_식별자_정의와_분류.md"
        },
        {
          "slug": "09_식별_비식별_관계와_키",
          "title": "09_식별_비식별_관계와_키",
          "filePath": "01_데이터_모델링의_이해/09_식별_비식별_관계와_키.md"
        },
        {
          "slug": "10_정규화_이상현상과_함수적_종속",
          "title": "10_정규화_이상현상과_함수적_종속",
          "filePath": "01_데이터_모델링의_이해/10_정규화_이상현상과_함수적_종속.md"
        },
        {
          "slug": "11_정규화_단계_1NF부터_5NF",
          "title": "11_정규화_단계_1NF부터_5NF",
          "filePath": "01_데이터_모델링의_이해/11_정규화_단계_1NF부터_5NF.md"
        },
        {
          "slug": "12_관계와_조인_계층_상호배타",
          "title": "12_관계와_조인_계층_상호배타",
          "filePath": "01_데이터_모델링의_이해/12_관계와_조인_계층_상호배타.md"
        },
        {
          "slug": "13_트랜잭션과_NULL",
          "title": "13_트랜잭션과_NULL",
          "filePath": "01_데이터_모델링의_이해/13_트랜잭션과_NULL.md"
        },
        {
          "slug": "14_본질식별자와_인조식별자",
          "title": "14_본질식별자와_인조식별자",
          "filePath": "01_데이터_모델링의_이해/14_본질식별자와_인조식별자.md"
        }
      ]
    }
  ]
}

export { sqldSection }
