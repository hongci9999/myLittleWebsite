import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createLink, updateLink, type LinkWithValues } from '@/shared/api/links'
import { LinkForm } from '@/widgets/LinkForm'
import type { DimensionWithValues } from '@/shared/api/links'

interface AddLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  dimensions: DimensionWithValues[]
  setDimensions: (d: DimensionWithValues[]) => void
  onLinkAdded: () => void
  /** 설정 시 같은 창에서 링크 수정 (관리자 페이지용) */
  linkToEdit?: LinkWithValues | null
}

export default function AddLinkDialog({
  open,
  onOpenChange,
  token,
  dimensions,
  setDimensions,
  onLinkAdded,
  linkToEdit = null,
}: AddLinkDialogProps) {
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
  }

  const handleSubmit = async (data: {
    url: string
    title: string
    description?: string
    valueIds: string[]
    isFeatured?: boolean
    faviconUrl?: string | null
  }) => {
    try {
      if (linkToEdit) {
        const updated = await updateLink(token, linkToEdit.id, {
          url: data.url,
          title: data.title,
          description: data.description,
          valueIds: data.valueIds,
          isFeatured: data.isFeatured,
          faviconUrl: data.faviconUrl,
        })
        if (updated) {
          onLinkAdded()
          handleOpenChange(false)
        }
      } else {
        const created = await createLink(token, {
          url: data.url,
          title: data.title,
          description: data.description,
          valueIds: data.valueIds,
          isFeatured: data.isFeatured,
          faviconUrl: data.faviconUrl,
        })
        if (created) {
          onLinkAdded()
          handleOpenChange(false)
        }
      }
    } finally {
      /* LinkForm handles submitLoading */
    }
  }

  const isEdit = !!linkToEdit

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-3 p-5">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">
            {isEdit ? '링크 수정' : '링크 추가'}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <LinkForm
            key={isEdit ? linkToEdit.id : 'new'}
            token={token}
            dimensions={dimensions}
            setDimensions={setDimensions}
            initialValues={
              isEdit
                ? {
                    url: linkToEdit.url,
                    title: linkToEdit.title,
                    description: linkToEdit.description ?? '',
                    valueIds: new Set(linkToEdit.valueIds),
                    isFeatured: linkToEdit.isFeatured ?? false,
                    faviconUrl: linkToEdit.faviconUrl ?? '',
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => handleOpenChange(false)}
            submitLabel={isEdit ? '저장' : '추가'}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
