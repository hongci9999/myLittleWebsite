const NOTICE_BODY =
  "본 카드는 이영도 작가의 작품 '눈물을 마시는새'의 아트북인 '한계선을 넘다'의 이미지를 AI로 편집하여 만든 이미지입니다."

const NOTICE_COPYRIGHT =
  '본 이미지의 저작권은 원저작권자에게 있으며, 본 사이트에서는 비영리·개인적 용도로만 게시합니다. 상업적 이용 및 수익 창출 목적으로 사용하지 않습니다.'

export function TarotImageNotice() {
  return (
    <div className="tarot-image-notice group relative shrink-0">
      <button
        type="button"
        className="tarot-image-notice-button"
        aria-label="카드 이미지 출처 및 저작권 안내"
        aria-describedby="tarot-image-notice-panel"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      <div
        id="tarot-image-notice-panel"
        role="tooltip"
        className="tarot-image-notice-panel"
      >
        <p>{NOTICE_BODY}</p>
        <p className="tarot-image-notice-panel-copyright">{NOTICE_COPYRIGHT}</p>
      </div>
    </div>
  )
}
